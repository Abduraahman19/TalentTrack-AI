import { useEffect, useState } from 'react';
import { getCandidates } from '../services/api';

const CandidateList = ({ token, reloadKey }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await getCandidates(token);
        const candidatesData = Array.isArray(response.data) ? response.data : [];
        setCandidates(candidatesData);
      } catch (err) {
        setError('Failed to fetch candidates');
        console.error('Fetch candidates error:', err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [token, reloadKey]);

  if (loading) return <div>Loading candidates...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Candidate List</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {candidates.map(candidate => (
          <div key={candidate._id} className="border rounded-lg p-4 shadow">
            <h3 className="text-xl font-semibold">{candidate.name}</h3>
            <p className="text-gray-600">{candidate.email}</p>
            <p className="text-gray-600">{candidate.phone}</p>

            <div className="mt-3">
              <h4 className="font-medium">Skills:</h4>
              <div className="flex flex-wrap gap-1 mt-1">
                {candidate.skills.map(skill => (
                  <span
                    key={skill}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <h4 className="font-medium">Experience:</h4>
              {candidate.experience?.map((exp, i) => (
                <div key={i} className="mt-1">
                  <p className="font-medium">
                    {exp.jobTitle} at {exp.company}
                  </p>
                  <p className="text-sm text-gray-600">{exp.duration}</p>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <h4 className="font-medium">Role Matches:</h4>
              {candidate.roleMatchScores?.map((match, i) => (
                <div key={i} className="mt-2 p-2 bg-gray-50 rounded">
                  <p className="font-medium">{match.roleId?.title}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        match.score > 70
                          ? 'bg-green-500'
                          : match.score > 40
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${match.score}%` }}
                    ></div>
                  </div>
                  <p className="text-sm mt-1">{match.score}% match</p>
                  <p className="text-xs text-gray-600">{match.explanation}</p>
                </div>
              ))}
            </div>

            {candidate.resumePath && (
              <a
                href={`http://localhost:5000${candidate.resumePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-blue-600 hover:underline text-sm"
              >
                View Resume
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CandidateList;
