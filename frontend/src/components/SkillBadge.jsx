

const SkillBadge = ({ skill }) => {
  return (
    <span className="px-2 py-1 text-sm text-blue-700 bg-blue-100 rounded-md">
      {skill}
    </span>
  );
};

export default SkillBadge; // ✅ Default export add kar diya
