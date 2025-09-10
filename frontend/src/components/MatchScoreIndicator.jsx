const MatchScoreIndicator = ({ score }) => {
  const getColor = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center">
      <span className="mr-2 text-sm font-medium text-gray-700">{score}%</span>
      <div className="w-16 h-2 overflow-hidden bg-gray-200 rounded-full">
        <div 
          className={`h-full ${getColor()}`} 
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

export default MatchScoreIndicator;