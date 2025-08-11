const natural = require('natural');
const { TfIdf } = natural;

// Enhanced skill matching with weights
const calculateMatchScore = (candidateSkills, jobSkills) => {
  if (!jobSkills || jobSkills.length === 0) return 0;
  if (!candidateSkills || candidateSkills.length === 0) return 0;

  // Create a TF-IDF instance
  const tfidf = new TfIdf();
  
  // Add documents
  tfidf.addDocument(candidateSkills.join(' ').toLowerCase());
  tfidf.addDocument(jobSkills.join(' ').toLowerCase());

  // Calculate similarity
  let score = 0;
  const jobSkillsText = jobSkills.join(' ').toLowerCase();
  
  tfidf.tfidfs(jobSkillsText, (i, measure) => {
    if (i === 0) score = measure; // The first document is the candidate's skills
  });

  // Normalize the score to 0-100 range
  const normalizedScore = Math.min(Math.max(Math.round((score + 1) * 25), 100));
  
  // Apply bonus for exact matches
  const exactMatches = jobSkills.filter(skill => 
    candidateSkills.some(cSkill => 
      cSkill.toLowerCase() === skill.toLowerCase()
    )
  ).length;

  const exactMatchBonus = exactMatches * 5;
  
  return Math.min(normalizedScore + exactMatchBonus, 100);
};

const generateMatchExplanation = (candidateSkills, jobSkills) => {
  if (!jobSkills || jobSkills.length === 0) return 'No job skills defined';
  if (!candidateSkills || candidateSkills.length === 0) return 'No candidate skills found';

  // Find missing skills (in job but not in candidate)
  const missingSkills = jobSkills.filter(skill => 
    !candidateSkills.some(cSkill => 
      natural.JaroWinklerDistance(cSkill.toLowerCase(), skill.toLowerCase()) > 0.8
    )
  );

  // Find strong matches (exact or near-exact matches)
  const strongSkills = candidateSkills.filter(skill => 
    jobSkills.some(jSkill => 
      natural.JaroWinklerDistance(skill.toLowerCase(), jSkill.toLowerCase()) > 0.9
    )
  );

  // Find partial matches
  const partialSkills = candidateSkills.filter(skill => 
    jobSkills.some(jSkill => 
      natural.JaroWinklerDistance(skill.toLowerCase(), jSkill.toLowerCase()) > 0.7 &&
      natural.JaroWinklerDistance(skill.toLowerCase(), jSkill.toLowerCase()) <= 0.9
    )
  );

  let explanation = '';
  
  if (missingSkills.length > 0) {
    explanation += `Missing ${missingSkills.length} key skills: ${missingSkills.slice(0, 5).join(', ')}`;
    if (missingSkills.length > 5) explanation += ` and ${missingSkills.length - 5} more`;
    explanation += '. ';
  }

  if (strongSkills.length > 0) {
    explanation += `Strong in ${strongSkills.length} skills: ${strongSkills.slice(0, 5).join(', ')}`;
    if (strongSkills.length > 5) explanation += ` and ${strongSkills.length - 5} more`;
    explanation += '. ';
  }

  if (partialSkills.length > 0) {
    explanation += `Partially matches ${partialSkills.length} skills: ${partialSkills.slice(0, 3).join(', ')}`;
    if (partialSkills.length > 3) explanation += ` and ${partialSkills.length - 3} more`;
    explanation += '.';
  }

  if (!explanation) {
    explanation = 'No significant matches found between candidate skills and job requirements.';
  }

  return explanation.trim();
};

module.exports = {
  calculateMatchScore,
  generateMatchExplanation
};