import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus, FiTrash2, FiCheck } from 'react-icons/fi';
import { useSnackbar } from '../context/SnackbarContext';
import { createJobDescription, updateJobDescription } from '../services/api';

const JobDescriptionForm = ({ job = null, onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();
  const { showSnackbar } = useSnackbar();
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [preferredSkills, setPreferredSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSkillInput, setActiveSkillInput] = useState(null);

  // Predefined skill suggestions
  const skillSuggestions = [
    'JavaScript', 'React', 'Node.js', 'Python', 'Java', 
    'AWS', 'Docker', 'Kubernetes', 'SQL', 'MongoDB',
    'GraphQL', 'TypeScript', 'Redux', 'HTML/CSS', 'Git'
  ];

  useEffect(() => {
    if (job) {
      reset({
        title: job.title,
        description: job.description,
        minExperience: job.minExperience,
        salaryRangeMin: job.salaryRange?.min,
        salaryRangeMax: job.salaryRange?.max,
        location: job.location,
        employmentType: job.employmentType,
        isActive: job.isActive
      });
      setRequiredSkills(job.requiredSkills || []);
      setPreferredSkills(job.preferredSkills || []);
    }
  }, [job, reset]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      if (requiredSkills.length === 0) {
        throw new Error('At least one required skill is needed');
      }

      const jobData = {
        title: data.title,
        description: data.description || '',
        requiredSkills,
        preferredSkills,
        minExperience: parseFloat(data.minExperience) || 0,
        salaryRange: {
          min: parseFloat(data.salaryRangeMin) || 0,
          max: parseFloat(data.salaryRangeMax) || 0
        },
        location: data.location || '',
        employmentType: data.employmentType || 'Full-time',
        ...(job && { isActive: data.isActive })
      };

      if (job) {
        await updateJobDescription(job._id, jobData);
        showSnackbar('Job updated successfully!', 'success');
      } else {
        await createJobDescription(jobData);
        showSnackbar('Job created successfully!', 'success');
      }

      onSuccess();

    } catch (error) {
      let errorMessage = 'Failed to save job';
      if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).join('\n');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showSnackbar(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSkill = (list, setList) => {
    if (newSkill.trim() && !list.includes(newSkill.trim())) {
      setList([...list, newSkill.trim()]);
      setNewSkill('');
      setActiveSkillInput(null);
    }
  };

  const removeSkill = (list, setList, index) => {
    const newList = [...list];
    newList.splice(index, 1);
    setList(newList);
  };

  const handleSkillSuggestionClick = (skill, list, setList) => {
    if (!list.includes(skill)) {
      setList([...list, skill]);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {job ? 'Edit Job Posting' : 'Create New Job Posting'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-500 transition-colors rounded-full hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close form"
        >
          <FiX size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Job Title<span className="text-red-500">*</span>
            </label>
            <input
              {...register('title', { required: 'Job title is required' })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g. Senior React Developer"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Employment Type
            </label>
            <select
              {...register('employmentType')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Temporary">Temporary</option>
              <option value="Internship">Internship</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Job Description
          </label>
          <textarea
            {...register('description')}
            rows={5}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="Describe the role, responsibilities, and qualifications..."
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Minimum Experience (years)
            </label>
            <div className="relative">
              <input
                type="number"
                {...register('minExperience')}
                min="0"
                step="0.5"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <span className="absolute text-gray-400 transform -translate-y-1/2 right-4 top-1/2">
                yrs
              </span>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Salary Range Min
            </label>
            <div className="relative">
              <input
                type="number"
                {...register('salaryRangeMin')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="e.g. 60000"
              />
              <span className="absolute text-gray-400 transform -translate-y-1/2 right-4 top-1/2">
                $
              </span>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Salary Range Max
            </label>
            <div className="relative">
              <input
                type="number"
                {...register('salaryRangeMax')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="e.g. 90000"
              />
              <span className="absolute text-gray-400 transform -translate-y-1/2 right-4 top-1/2">
                $
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            {...register('location')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="e.g. Remote, San Francisco, etc."
          />
        </div>

        <div className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Required Skills<span className="text-red-500">*</span>
            </label>
            
            <div className="flex mb-2 space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={activeSkillInput === 'required' ? newSkill : ''}
                  onChange={(e) => {
                    setNewSkill(e.target.value);
                    setActiveSkillInput('required');
                  }}
                  onFocus={() => setActiveSkillInput('required')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Add required skill"
                />
                {activeSkillInput === 'required' && newSkill && (
                  <button
                    type="button"
                    onClick={() => addSkill(requiredSkills, setRequiredSkills)}
                    className="absolute p-1 text-white transition-colors transform -translate-y-1/2 bg-blue-600 rounded-md right-2 top-1/2 hover:bg-blue-700"
                  >
                    <FiPlus />
                  </button>
                )}
              </div>
            </div>

            {activeSkillInput === 'required' && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {skillSuggestions.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillSuggestionClick(skill, requiredSkills, setRequiredSkills)}
                      disabled={requiredSkills.includes(skill)}
                      className={`px-3 py-1 text-sm rounded-full flex items-center transition-all ${
                        requiredSkills.includes(skill)
                          ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {skill}
                      {requiredSkills.includes(skill) && (
                        <FiCheck className="ml-1 text-blue-600" size={14} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {requiredSkills.map((skill, index) => (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center px-3 py-1 text-sm text-blue-800 bg-blue-100 rounded-full shadow-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(requiredSkills, setRequiredSkills, index)}
                      className="ml-2 text-blue-600 transition-colors hover:text-blue-800"
                      aria-label={`Remove ${skill}`}
                    >
                      <FiX size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Preferred Skills
            </label>
            
            <div className="flex mb-2 space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={activeSkillInput === 'preferred' ? newSkill : ''}
                  onChange={(e) => {
                    setNewSkill(e.target.value);
                    setActiveSkillInput('preferred');
                  }}
                  onFocus={() => setActiveSkillInput('preferred')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="Add preferred skill"
                />
                {activeSkillInput === 'preferred' && newSkill && (
                  <button
                    type="button"
                    onClick={() => addSkill(preferredSkills, setPreferredSkills)}
                    className="absolute p-1 text-white transition-colors transform -translate-y-1/2 bg-green-600 rounded-md right-2 top-1/2 hover:bg-green-700"
                  >
                    <FiPlus />
                  </button>
                )}
              </div>
            </div>

            {activeSkillInput === 'preferred' && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {skillSuggestions.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillSuggestionClick(skill, preferredSkills, setPreferredSkills)}
                      disabled={preferredSkills.includes(skill)}
                      className={`px-3 py-1 text-sm rounded-full flex items-center transition-all ${
                        preferredSkills.includes(skill)
                          ? 'bg-green-100 text-green-800 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {skill}
                      {preferredSkills.includes(skill) && (
                        <FiCheck className="ml-1 text-green-600" size={14} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {preferredSkills.map((skill, index) => (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center px-3 py-1 text-sm text-green-800 bg-green-100 rounded-full shadow-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(preferredSkills, setPreferredSkills, index)}
                      className="ml-2 text-green-600 transition-colors hover:text-green-800"
                      aria-label={`Remove ${skill}`}
                    >
                      <FiX size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {job && (
          <div className="flex items-center">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="isActive"
                {...register('isActive')}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                Active Job Posting
              </span>
            </label>
          </div>
        )}

        <div className="flex justify-end pt-4 space-x-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || requiredSkills.length === 0}
            className={`px-6 py-2.5 text-white rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 font-medium ${
              isSubmitting || requiredSkills.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : job ? (
              'Update Job Posting'
            ) : (
              'Create Job Posting'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobDescriptionForm;
