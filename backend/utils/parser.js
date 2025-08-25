const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced prompt with better list handling instructions
const RESUME_PARSE_PROMPT = `
You are an expert resume parser. Extract information from resumes in ANY format and return ONLY valid JSON.

CRITICAL PARSING RULES:
1. Skills can appear as:
   - Bullet points (• JavaScript, • Python)
   - Dashes (- React, - Node.js)  
   - Numbered lists (1. HTML, 2. CSS)
   - Comma-separated (JavaScript, Python, React)
   - Line-separated items
   - Bold text followed by skills
   - Table format
   - Mixed formats

2. Look for these section indicators:
   - SKILLS, Technical Skills, Core Competencies, Technologies
   - EXPERIENCE, Work Experience, Professional Experience, Employment
   - EDUCATION, Academic Background, Qualifications

3. Extract skills from ANY of these patterns:
   - Lines starting with bullet symbols (•, -, *, →)
   - Items separated by commas, semicolons, or pipes (|)
   - Each line as a separate skill if in a skills section
   - Skills mentioned in experience descriptions
   - Programming languages, frameworks, tools, methodologies

4. For experience, look for:
   - Job titles (often in bold or larger text)
   - Company names (may follow job title or be on separate line)
   - Dates/duration (various formats: 2020-2023, Jan 2020 - Present, etc.)

Return this exact JSON structure:
{
  "name": "Full name",
  "email": "Email address", 
  "phone": "Phone number",
  "skills": ["Skill1", "Skill2", "Skill3"],
  "experience": [{
    "jobTitle": "Position",
    "company": "Company name",
    "duration": "Time period", 
    "description": "Key responsibilities"
  }],
  "education": [{
    "degree": "Degree name",
    "institution": "School name",
    "year": "Year/period"
  }]
}

IMPORTANT: 
- Extract ALL skills found, even if formatted differently
- Normalize skill names (JS → JavaScript, React.js → React)
- If no clear structure, extract skills mentioned anywhere in the resume
- Return ONLY the JSON object, no explanatory text

Resume content:
`;

// Improved text preprocessing to preserve list structures
const preprocessResumeText = (text) => {
  // Preserve list structures and bullet points
  let processed = text
    // Normalize different bullet point types
    .replace(/[•◦▪▫‣⁃]/g, '• ')
    // Normalize dash-based lists
    .replace(/^\s*[-−–—]\s*/gm, '• ')
    // Normalize asterisk lists
    .replace(/^\s*\*\s*/gm, '• ')
    // Preserve numbered lists
    .replace(/^\s*(\d+\.)\s*/gm, '$1 ')
    // Clean up excessive whitespace while preserving line breaks
    .replace(/[ \t]+/g, ' ')
    // Ensure proper line breaks are maintained
    .replace(/\n\s*\n/g, '\n\n');

  // Enhanced section identification with more variations
  const sectionPatterns = {
    'SKILLS': /\b(skills?|technical\s*skills?|core\s*competencies|technologies?|expertise|proficiencies?|capabilities)\b/gi,
    'EXPERIENCE': /\b(experience|work\s*experience|professional\s*experience|employment\s*history?|career\s*history?)\b/gi,
    'EDUCATION': /\b(education|academic\s*background|qualifications?|academics?|studies)\b/gi,
    'PROJECTS': /\b(projects?|portfolio|work\s*samples?)\b/gi
  };

  // Mark sections more clearly for the AI
  Object.entries(sectionPatterns).forEach(([sectionName, pattern]) => {
    processed = processed.replace(pattern, `\n\n=== ${sectionName} SECTION ===\n`);
  });

  return processed;
};

// Enhanced fallback extraction with better list handling
function extractBasicInfo(text) {
  const result = {
    name: '',
    email: '',
    phone: '',
    skills: [],
    experience: [],
    education: []
  };

  // Extract email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) result.email = emailMatch[0];

  // Extract phone with better patterns
  const phonePatterns = [
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
    /(\+?\d{1,3}[-.\s]?)?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,
    /\+\d{1,3}\s?\d{3,4}\s?\d{3,4}\s?\d{3,4}/
  ];
  
  for (const pattern of phonePatterns) {
    const phoneMatch = text.match(pattern);
    if (phoneMatch) {
      result.phone = phoneMatch[0];
      break;
    }
  }

  // Extract name (improved logic)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  for (const line of lines.slice(0, 5)) { // Check first 5 lines
    const cleanLine = line.trim();
    if (cleanLine.length > 2 && 
        !cleanLine.includes('@') && 
        !cleanLine.match(/^\+?\d/) && // Not a phone
        !cleanLine.toLowerCase().includes('resume') &&
        !cleanLine.toLowerCase().includes('cv')) {
      result.name = cleanLine;
      break;
    }
  }

  // Enhanced skill extraction
  const skillsSection = extractSkillsSection(text);
  if (skillsSection.length > 0) {
    result.skills = skillsSection;
  } else {
    // Fallback to common tech skills
    const commonSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js', 'Express',
      'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Git',
      'Angular', 'Vue.js', 'PHP', 'C++', 'C#', '.NET', 'Spring', 'Django',
      'Flask', 'Bootstrap', 'Tailwind', 'REST', 'GraphQL', 'Redis', 'Kubernetes'
    ];
    
    result.skills = commonSkills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );
  }

  return result;
}

// New function to extract skills from different list formats
function extractSkillsSection(text) {
  const skills = new Set();
  const lines = text.split('\n');
  
  let inSkillsSection = false;
  let skillsSectionLines = [];
  
  // Find skills section
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lowerLine = line.toLowerCase();
    
    // Check if we're entering a skills section
    if (lowerLine.match(/\b(skills?|technical\s*skills?|competencies|technologies?|expertise)\b/)) {
      inSkillsSection = true;
      continue;
    }
    
    // Check if we're leaving skills section (next major section)
    if (inSkillsSection && lowerLine.match(/\b(experience|education|projects?|certifications?)\b/)) {
      break;
    }
    
    // Collect skills section lines
    if (inSkillsSection && line.length > 0) {
      skillsSectionLines.push(line);
    }
  }
  
  // Process skills section lines
  for (const line of skillsSectionLines) {
    // Handle bullet points and dashes
    if (line.match(/^\s*[•\-\*]\s*(.+)$/)) {
      const skillText = line.replace(/^\s*[•\-\*]\s*/, '').trim();
      extractSkillsFromText(skillText, skills);
    }
    // Handle numbered lists
    else if (line.match(/^\s*\d+\.\s*(.+)$/)) {
      const skillText = line.replace(/^\s*\d+\.\s*/, '').trim();
      extractSkillsFromText(skillText, skills);
    }
    // Handle comma/semicolon separated
    else if (line.includes(',') || line.includes(';')) {
      extractSkillsFromText(line, skills);
    }
    // Handle plain lines (each line is a skill)
    else if (line.trim().length > 1 && !line.includes(':')) {
      extractSkillsFromText(line.trim(), skills);
    }
  }
  
  return Array.from(skills);
}

function extractSkillsFromText(text, skillsSet) {
  // Split by common separators
  const separators = /[,;|\/]/;
  const items = text.split(separators);
  
  for (let item of items) {
    item = item.trim();
    if (item.length > 1) {
      // Clean up the skill name
      item = item.replace(/[()[\]]/g, ''); // Remove brackets
      item = item.replace(/^\W+|\W+$/g, ''); // Remove leading/trailing non-word chars
      
      if (item.length > 1) {
        skillsSet.add(item);
      }
    }
  }
}

async function parseWithGemini(text) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1, // Lower temperature for more consistent parsing
        maxOutputTokens: 2048,
      }
    });
    
    const processedText = preprocessResumeText(text);
    
    const result = await model.generateContent(RESUME_PARSE_PROMPT + processedText);
    const response = await result.response;
    let jsonText = response.text();
    
    // Clean up the response to get only JSON
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // More robust JSON extraction
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No JSON found in response');
    }
    
    const jsonString = jsonText.slice(jsonStart, jsonEnd);
    
    try {
      const parsed = JSON.parse(jsonString);
      
      // Post-process to ensure skills are properly extracted
      if (parsed.skills && parsed.skills.length === 0) {
        const fallbackSkills = extractSkillsSection(text);
        if (fallbackSkills.length > 0) {
          parsed.skills = fallbackSkills;
        }
      }
      
      // Clean up skills array
      if (parsed.skills) {
        parsed.skills = parsed.skills
          .filter(skill => skill && skill.trim().length > 1)
          .map(skill => skill.trim())
          .filter((skill, index, arr) => arr.indexOf(skill) === index); // Remove duplicates
      }
      
      return parsed;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Raw JSON string:', jsonString);
      
      // Enhanced JSON fixing
      let fixedJson = jsonString
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
        .replace(/'/g, '"')
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/([}\]])\s*,/g, '$1');
      
      return JSON.parse(fixedJson);
    }
  } catch (error) {
    console.error('Gemini parsing error:', error);
    return extractBasicInfo(text);
  }
}

module.exports = {
  parsePDF: async (buffer) => {
    try {
      const data = await pdf(buffer);
      console.log('Extracted PDF text length:', data.text.length);
      
      const parsedData = await parseWithGemini(data.text);
      
      // Enhanced name extraction fallback
      if (!parsedData.name || parsedData.name === 'Unknown' || parsedData.name.trim() === '') {
        const lines = data.text.split('\n').filter(line => line.trim().length > 0);
        for (const line of lines.slice(0, 10)) { // Check first 10 lines
          const cleanLine = line.trim();
          if (cleanLine.length > 2 && 
              !cleanLine.includes('@') && 
              !cleanLine.match(/^\+?\d/) &&
              !cleanLine.toLowerCase().includes('resume') &&
              !cleanLine.toLowerCase().includes('curriculum')) {
            parsedData.name = cleanLine;
            break;
          }
        }
      }
      
      // Skills fallback if still empty
      if (!parsedData.skills || parsedData.skills.length === 0) {
        parsedData.skills = extractSkillsSection(data.text);
      }
      
      return parsedData;
    } catch (error) {
      console.error('PDF parsing error:', error);
      const data = await pdf(buffer);
      return extractBasicInfo(data.text);
    }
  },
  
  parseDOCX: async (buffer) => {
    try {
      const result = await mammoth.extractRawText({ buffer });
      console.log('Extracted DOCX text length:', result.value.length);
      
      const parsedData = await parseWithGemini(result.value);
      
      // Apply same fallbacks as PDF
      if (!parsedData.name || parsedData.name.trim() === '') {
        const lines = result.value.split('\n').filter(line => line.trim().length > 0);
        for (const line of lines.slice(0, 10)) {
          const cleanLine = line.trim();
          if (cleanLine.length > 2 && 
              !cleanLine.includes('@') && 
              !cleanLine.match(/^\+?\d/) &&
              !cleanLine.toLowerCase().includes('resume')) {
            parsedData.name = cleanLine;
            break;
          }
        }
      }
      
      if (!parsedData.skills || parsedData.skills.length === 0) {
        parsedData.skills = extractSkillsSection(result.value);
      }
      
      return parsedData;
    } catch (error) {
      console.error('DOCX parsing error:', error);
      const result = await mammoth.extractRawText({ buffer });
      return extractBasicInfo(result.value);
    }
  }
};