const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const natural = require('natural');
const { stopwords } = require('natural/lib/natural/util/stopwords');

// Enhanced skill extraction with more comprehensive database
const SKILLS_DATABASE = [
  // Programming Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin',
  'Rust', 'Scala', 'Perl', 'R', 'Dart', 'Elixir', 'Clojure', 'Haskell', 'Erlang',

  // Frontend
  'React', 'Angular', 'Vue', 'Svelte', 'Next.js', 'Nuxt.js', 'Gatsby', 'Redux', 'MobX',
  'HTML', 'CSS', 'SASS', 'LESS', 'Tailwind CSS', 'Bootstrap', 'Material UI', 'Styled Components',

  // Backend
  'Node.js', 'Express', 'NestJS', 'Django', 'Flask', 'Spring', 'Laravel', 'Ruby on Rails',
  'ASP.NET', 'FastAPI', 'GraphQL', 'REST API', 'Microservices', 'Serverless',

  // Databases
  'MongoDB', 'MySQL', 'PostgreSQL', 'SQLite', 'Oracle', 'SQL Server', 'Firebase', 'Redis',
  'Elasticsearch', 'DynamoDB', 'Cassandra', 'Neo4j', 'Cosmos DB',

  // DevOps & Cloud
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'CI/CD', 'Jenkins', 'GitHub Actions',
  'Terraform', 'Ansible', 'Nginx', 'Apache', 'Linux', 'Bash', 'Shell Scripting',

  // Mobile
  'React Native', 'Flutter', 'Android', 'iOS', 'Xamarin', 'Ionic',

  // AI/ML
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras', 'NLP', 'Computer Vision',
  'Data Science', 'Pandas', 'NumPy', 'Scikit-learn', 'OpenCV',

  // Other
  'Git', 'Agile', 'Scrum', 'JIRA', 'TDD', 'DDD', 'Clean Architecture', 'OOP', 'Functional Programming',
  'Blockchain', 'Web3', 'Solidity', 'Ethereum', 'Cybersecurity', 'Penetration Testing'
];

const extractSkills = (text) => {
  try {
    if (!text || typeof text !== 'string') {
      console.warn('Invalid text input for skill extraction');
      return [];
    }

    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(text.toLowerCase()) || [];

    const filtered = tokens.filter(token =>
      token && !stopwords.includes(token) && /^[a-z]+$/.test(token)
    );

    const foundSkills = SKILLS_DATABASE.filter(skill =>
      filtered.some(token =>
        skill.toLowerCase().includes(token) ||
        token.includes(skill.toLowerCase())
      )
    );

    return [...new Set(foundSkills)];
  } catch (error) {
    console.error('Skill extraction error:', error);
    return [];
  }
};


const extractExperience = (text) => {
  // Improved experience extraction
  const expRegex = /(\d+)\s*(years?|yrs?|y)/i;
  const match = text.match(expRegex);
  return match ? parseInt(match[1]) : 0;
};

const extractEducation = (text) => {
  const eduKeywords = [
    'university', 'college', 'institute', 'institution', 'academy',
    'bachelor', 'bsc', 'b.tech', 'bs', 'ba',
    'master', 'msc', 'm.tech', 'ms', 'ma', 'mba', 'mphil',
    'phd', 'doctorate', 'pgdm', 'mca', 'bca', 'diploma'
  ];

  const lines = text.split('\n');
  return lines
    .filter(line => eduKeywords.some(keyword => line.toLowerCase().includes(keyword)))
    .map(line => line.trim())
    .filter(line => line.length > 0);
};

const extractContactInfo = (text) => {
  // Improved email extraction
  const email = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i)?.[0] || '';

  // Improved phone extraction (supports international formats)
  const phone = text.match(/(\+?\d[\d\s-]{7,}\d)/)?.[0] || '';

  return { email, phone };
};

const parseResumeText = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  const { email, phone } = extractContactInfo(text);

  // Improved name extraction (first non-empty line that doesn't contain email or phone)
  let name = '';
  for (const line of lines) {
    if (!line.includes('@') && !line.match(/(\+?\d[\d\s-]{7,}\d)/)) {
      name = line.trim();
      break;
    }
  }

  // Extract experience details
  const experience = [];
  const expSectionRegex = /experience|work history|employment history|professional experience/i;
  let inExpSection = false;

  for (const line of lines) {
    if (expSectionRegex.test(line)) {
      inExpSection = true;
      continue;
    }

    if (inExpSection) {
      const expMatch = line.match(/(.+?)\s+at\s+(.+?)\s+\((.*?)\)/i) ||
        line.match(/(.+?)\s*-\s*(.+?)\s*,\s*(.*)/i);

      if (expMatch) {
        experience.push({
          jobTitle: expMatch[1].trim(),
          company: expMatch[2].trim(),
          duration: expMatch[3].trim(),
          description: ''
        });
      }
    }
  }

  return {
    name: name || 'Unknown',
    email,
    phone,
    skills: extractSkills(text),
    experience: experience.length > 0 ? experience : [{ // Fallback if no structured experience found
      jobTitle: 'Unknown',
      company: 'Unknown',
      duration: `${extractExperience(text)} years`,
      description: ''
    }],
    education: extractEducation(text)
  };
};

module.exports = {
  parsePDF: async (buffer) => {
    try {
      const data = await pdf(buffer);
      return parseResumeText(data.text);
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF file');
    }
  },
  parseDOCX: async (buffer) => {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return parseResumeText(result.value);
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw new Error('Failed to parse DOCX file');
    }
  }
};