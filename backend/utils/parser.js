const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced professional prompt for resume parsing
const RESUME_PARSE_PROMPT = `
You are an expert resume parser with 10+ years of experience in HR technology. 
Extract information from ANY resume format (traditional, modern, creative, international) and return structured JSON.

CRITICAL EXTRACTION GUIDELINES:
1. NAME DETECTION: 
   - Look for the largest font text typically at the top
   - Check for "Name:", "Full Name:", or similar labels
   - Consider text before contact information
   - International formats may put name in different locations

2. CONTACT INFORMATION:
   - Email: Look for @ symbol patterns
   - Phone: International formats (+XX), various separators (., -, spaces)
   - Multiple contact methods may be present

3. SKILLS EXTRACTION (MOST IMPORTANT):
   - Extract from dedicated "Skills", "Technical Skills", "Competencies" sections
   - Also extract from experience descriptions, projects, and summary
   - Look for: bullet points (•, -, *), comma-separated lists, tables, icons
   - Include: programming languages, frameworks, tools, methodologies, soft skills
   - Normalize variations: "JS" → "JavaScript", "React.js" → "React"

4. EXPERIENCE DETECTION:
   - Job titles: Often bolded or in larger fonts
   - Companies: Usually beside or below job titles
   - Dates: Various formats (YYYY-YYYY, MM/YYYY, Month YYYY, present)
   - Look for reverse chronological order
   - Extract bullet points under each position

5. EDUCATION:
   - Degrees: Bachelor's, Master's, PhD, Certifications
   - Institutions: Universities, colleges, online platforms
   - Years: Graduation dates, attendance periods
   - GPA/Scores: If mentioned

6. FORMAT HANDLING:
   - Handle columns, tables, creative layouts
   - Parse both chronological and functional resumes
   - Extract from PDF text layers and DOCX formatting
   - Handle international date formats and naming conventions

7. FALLBACK STRATEGIES:
   - If section not clearly marked, use contextual clues
   - For skills: extract technologies mentioned anywhere
   - For dates: look for date-like patterns near job titles
   - For name: use the most prominent text not containing @ or numbers

Return this exact JSON structure:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+1234567890",
  "skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5"],
  "experience": [{
    "jobTitle": "Position Title",
    "company": "Company Name", 
    "duration": "Start - End Date",
    "description": "Key responsibilities and achievements"
  }],
  "education": [{
    "degree": "Degree Name",
    "institution": "Institution Name",
    "year": "Graduation Year"
  }]
}

IMPORTANT: 
- Extract maximum information from ANY format
- Normalize all data (trim whitespace, standardize formats)
- Return empty arrays if no data found in sections
- For skills, extract MINIMUM 8-10 items from various sections
- Handle missing fields gracefully
- Return ONLY valid JSON, no additional text

RESUME CONTENT TO PARSE:
`;

// Enhanced text preprocessing for better parsing
const preprocessResumeText = (text) => {
  // Preserve section structures and formatting clues
  let processed = text
    // Normalize various bullet point formats
    .replace(/[•◦▪▫‣⁃→]/g, '• ')
    .replace(/^\s*[-−–—]\s*/gm, '• ')
    .replace(/^\s*\*\s*/gm, '• ')
    
    // Preserve numbered lists
    .replace(/^\s*(\d+[.)])\s*/gm, '$1 ')
    
    // Clean excessive whitespace but preserve structure
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n');
  
  // Enhanced section identification with international variations
  const sectionPatterns = {
    'CONTACT': /\b(contact|information|details|get in touch|reach me|connect)\b/gi,
    'SUMMARY': /\b(summary|profile|objective|about me|executive summary)\b/gi,
    'EXPERIENCE': /\b(experience|work experience|employment|career|professional history|work history)\b/gi,
    'EDUCATION': /\b(education|academic|qualifications|degrees|certifications|studies)\b/gi,
    'SKILLS': /\b(skills|technical skills|competencies|expertise|proficiencies|technologies|tools|frameworks)\b/gi,
    'PROJECTS': /\b(projects|portfolio|key projects|work samples|achievements)\b/gi,
    'LANGUAGES': /\b(languages|language proficiency|linguistic skills)\b/gi
  };

  // Mark sections clearly for the AI
  Object.entries(sectionPatterns).forEach(([sectionName, pattern]) => {
    processed = processed.replace(pattern, `\n\n=== ${sectionName} SECTION ===\n`);
  });

  return processed;
};

// Advanced fallback extraction for when AI fails
const extractBasicInfo = (text) => {
  const result = {
    name: '',
    email: '',
    phone: '',
    skills: new Set(),
    experience: [],
    education: []
  };

  // Extract email with better pattern matching
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) result.email = emailMatch[0];

  // Extract phone with international support
  const phonePatterns = [
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
    /(\+?\d{1,3}[-.\s]?)?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,
    /\+\d{1,3}\s?\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{1,9}/,
    /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/
  ];
  
  for (const pattern of phonePatterns) {
    const phoneMatch = text.match(pattern);
    if (phoneMatch) {
      result.phone = phoneMatch[0];
      break;
    }
  }

  // Enhanced name extraction
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Strategy 1: Look for prominent text (likely name)
  for (const line of lines.slice(0, 8)) {
    const cleanLine = line.trim();
    if (cleanLine.length > 3 && 
        !cleanLine.includes('@') && 
        !cleanLine.match(/^\+?\d/) &&
        !cleanLine.toLowerCase().includes('resume') &&
        !cleanLine.toLowerCase().includes('curriculum') &&
        !cleanLine.toLowerCase().includes('vitae') &&
        cleanLine.split(' ').length <= 4) {
      result.name = cleanLine;
      break;
    }
  }

  // Enhanced skills extraction from multiple sources
  extractSkillsFromText(text, result.skills);
  
  // If still few skills, extract from entire document
  if (result.skills.size < 5) {
    extractTechnologiesFromText(text, result.skills);
  }

  result.skills = Array.from(result.skills).filter(skill => skill && skill.trim().length > 1);

  return result;
};

// Extract skills from structured sections
const extractSkillsFromText = (text, skillsSet) => {
  const lines = text.split('\n');
  let inSkillsSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lowerLine = line.toLowerCase();
    
    // Detect skills section
    if (lowerLine.match(/\b(skills?|technical|technologies?|expertise|proficiencies?|competencies)\b/)) {
      inSkillsSection = true;
      continue;
    }
    
    // Exit skills section when new major section starts
    if (inSkillsSection && lowerLine.match(/\b(experience|education|projects?|employment|work)\b/)) {
      inSkillsSection = false;
      break;
    }
    
    if (inSkillsSection && line.length > 1) {
      processSkillLine(line, skillsSet);
    }
  }
  
  // Also extract from bullet points anywhere in document
  lines.forEach(line => {
    if (line.match(/^\s*[•\-\*]\s*(.+)$/) || line.match(/^\s*\d+[.)]\s*(.+)$/)) {
      processSkillLine(line, skillsSet);
    }
  });
};

// Process individual skill lines with various formats
const processSkillLine = (line, skillsSet) => {
  // Remove bullet points and numbering
  let cleanLine = line.replace(/^\s*[•\-\*]\s*/, '')
                     .replace(/^\s*\d+[.)]\s*/, '')
                     .trim();
  
  // Handle comma-separated skills
  if (cleanLine.includes(',') || cleanLine.includes(';') || cleanLine.includes('/')) {
    const separators = /[,;|\/]/;
    cleanLine.split(separators).forEach(skill => {
      const trimmedSkill = skill.trim();
      if (trimmedSkill.length > 1) {
        skillsSet.add(normalizeSkillName(trimmedSkill));
      }
    });
  } else if (cleanLine.length > 2) {
    skillsSet.add(normalizeSkillName(cleanLine));
  }
};

// Normalize skill names to standard formats
const normalizeSkillName = (skill) => {
  const skillMap = {
    'js': 'JavaScript',
    'react.js': 'React',
    'node.js': 'Node.js',
    'html5': 'HTML',
    'css3': 'CSS',
    'python3': 'Python',
    'aws': 'Amazon Web Services',
    'gcp': 'Google Cloud Platform',
    'ai': 'Artificial Intelligence',
    'ml': 'Machine Learning'
  };
  
  const lowerSkill = skill.toLowerCase();
  return skillMap[lowerSkill] || skill;
};

// Extract technologies from experience and project descriptions
const extractTechnologiesFromText = (text, skillsSet) => {
  const commonTechnologies = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby',
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
    'HTML', 'CSS', 'SASS', 'LESS', 'Bootstrap', 'Tailwind', 'jQuery',
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git',
    'REST', 'GraphQL', 'SOAP', 'Microservices', 'CI/CD'
  ];
  
  commonTechnologies.forEach(tech => {
    if (text.toLowerCase().includes(tech.toLowerCase())) {
      skillsSet.add(tech);
    }
  });
};

async function parseWithGemini(text) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent parsing
        maxOutputTokens: 2048,
        topP: 0.8
      }
    });
    
    const processedText = preprocessResumeText(text);
    
    const result = await model.generateContent(RESUME_PARSE_PROMPT + processedText);
    const response = await result.response;
    let jsonText = response.text();
    
    // Robust JSON extraction
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No JSON found in Gemini response');
    }
    
    const jsonString = jsonText.slice(jsonStart, jsonEnd);
    
    try {
      const parsed = JSON.parse(jsonString);
      
      // Post-processing validation
      if (!parsed.name || parsed.name === 'Unknown') {
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        for (const line of lines.slice(0, 5)) {
          if (line.trim().length > 3 && !line.includes('@') && !line.match(/^\d/)) {
            parsed.name = line.trim();
            break;
          }
        }
      }
      
      // Ensure skills array is populated
      if (!parsed.skills || parsed.skills.length < 3) {
        const fallbackSkills = new Set();
        extractSkillsFromText(text, fallbackSkills);
        extractTechnologiesFromText(text, fallbackSkills);
        parsed.skills = Array.from(fallbackSkills).slice(0, 10);
      }
      
      // Clean and normalize data
      parsed.skills = parsed.skills
        .filter(skill => skill && skill.trim().length > 1)
        .map(skill => normalizeSkillName(skill.trim()))
        .filter((skill, index, arr) => arr.indexOf(skill) === index);
      
      return parsed;
      
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Fallback to basic extraction
      return extractBasicInfo(text);
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return extractBasicInfo(text);
  }
}

module.exports = {
  parsePDF: async (buffer) => {
    try {
      const data = await pdf(buffer);
      console.log('PDF text extracted, length:', data.text.length);
      
      const parsedData = await parseWithGemini(data.text);
      return parsedData;
    } catch (error) {
      console.error('PDF parsing failed:', error);
      // Fallback: extract text and use basic parsing
      try {
        const data = await pdf(buffer);
        return extractBasicInfo(data.text);
      } catch (fallbackError) {
        console.error('PDF fallback also failed:', fallbackError);
        throw new Error('Failed to parse PDF file: ' + fallbackError.message);
      }
    }
  },
  
  parseDOCX: async (buffer) => {
    try {
      const result = await mammoth.extractRawText({ buffer });
      console.log('DOCX text extracted, length:', result.value.length);
      
      const parsedData = await parseWithGemini(result.value);
      return parsedData;
    } catch (error) {
      console.error('DOCX parsing failed:', error);
      // Fallback: use extracted text with basic parsing
      try {
        const result = await mammoth.extractRawText({ buffer });
        return extractBasicInfo(result.value);
      } catch (fallbackError) {
        console.error('DOCX fallback also failed:', fallbackError);
        throw new Error('Failed to parse DOCX file: ' + fallbackError.message);
      }
    }
  }
};