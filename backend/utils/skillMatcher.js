const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced matching with Gemini
const calculateMatchScore = async (candidateSkills, jobSkills) => {
  if (!jobSkills || jobSkills.length === 0) return 0;
  if (!candidateSkills || candidateSkills.length === 0) return 0;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Calculate a match percentage (0-100) between these candidate skills and job requirements.
    Consider:
    - Exact matches (highest weight)
    - Similar technologies (medium weight)
    - Related concepts (low weight)
    
    Candidate Skills: ${JSON.stringify(candidateSkills)}
    Job Requirements: ${JSON.stringify(jobSkills)}
    
    Respond ONLY with the percentage number (0-100), no other text.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const matchText = response.text().trim();
    
    // Ensure we get a valid number
    const matchScore = parseInt(matchText);
    return Math.min(Math.max(isNaN(matchScore) ? 0 : matchScore, 0), 100);
  } catch (error) {
    console.error('Gemini matching error:', error);
    // Fallback to simple matching if API fails
    const intersection = jobSkills.filter(skill => 
      candidateSkills.some(cSkill => 
        cSkill.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(cSkill.toLowerCase())
      )
    ).length;
    
    return Math.round((intersection / jobSkills.length) * 100);
  }
};

const generateMatchExplanation = async (candidateSkills, jobSkills) => {
  if (!jobSkills || jobSkills.length === 0) return 'No job skills defined';
  if (!candidateSkills || candidateSkills.length === 0) return 'No candidate skills found';

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Analyze the match between candidate skills and job requirements.
    Provide a concise explanation (2-3 sentences) highlighting:
    - Strong matches (exact or near-exact)
    - Missing important skills
    - Any notable strengths
    
    Candidate Skills: ${JSON.stringify(candidateSkills)}
    Job Requirements: ${JSON.stringify(jobSkills)}
    
    Keep response under 100 words.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini explanation error:', error);
    // Fallback explanation
    const missing = jobSkills.filter(skill => !candidateSkills.includes(skill));
    const strong = candidateSkills.filter(skill => jobSkills.includes(skill));
    
    return `Strong in: ${strong.slice(0, 3).join(', ')}. Missing: ${missing.slice(0, 3).join(', ')}`;
  }
};

module.exports = {
  calculateMatchScore,
  generateMatchExplanation
};
