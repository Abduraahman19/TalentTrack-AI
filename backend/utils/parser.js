const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced prompt for resume parsing
const RESUME_PARSE_PROMPT = `
You are an expert resume parser. Extract the following information from the resume text in JSON format:

{
  "name": "Full name",
  "email": "Email address",
  "phone": "Phone number",
  "skills": ["List", "of", "technical", "skills"],
  "experience": [{
    "jobTitle": "Position",
    "company": "Company name",
    "duration": "Time period",
    "description": "Job description"
  }],
  "education": [{
    "degree": "Degree name",
    "institution": "School name",
    "year": "Graduation year"
  }]
}

Rules:
1. Only return valid JSON, no additional text
2. If information is missing, use empty strings/arrays
3. Normalize skill names (e.g., "JS" → "JavaScript")
4. For experience duration, use format like "2 years" or "2019-2021"
5. Extract at least 5 skills if available

Resume text: `;

async function parseWithGemini(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(RESUME_PARSE_PROMPT + text);
    const response = await result.response;
    const jsonText = response.text();
    
    // Clean the response to extract just the JSON
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}') + 1;
    const jsonString = jsonText.slice(jsonStart, jsonEnd);
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Gemini parsing error:', error);
    throw new Error('Failed to parse with Gemini API');
  }
}

module.exports = {
  parsePDF: async (buffer) => {
    try {
      const data = await pdf(buffer);
      return await parseWithGemini(data.text);
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF file');
    }
  },
  parseDOCX: async (buffer) => {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return await parseWithGemini(result.value);
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw new Error('Failed to parse DOCX file');
    }
  }
};