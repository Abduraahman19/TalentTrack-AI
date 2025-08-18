import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useSnackbar } from '../context/SnackbarContext';
import { createJobDescription, updateJobDescription } from '../services/api';

const JobDescriptionForm = ({ job = null, onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();
  const { showSnackbar } = useSnackbar();
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [preferredSkills, setPreferredSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      // Validate at least one required skill
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

      console.log('Submitting job data:', jobData);

      let response;
      if (job) {
        response = await updateJobDescription(job._id, jobData);
        showSnackbar('Job updated successfully!', 'success');
      } else {
        response = await createJobDescription(jobData);
        showSnackbar('Job created successfully!', 'success');
      }

      console.log('API response:', response);
      onSuccess();

    } catch (error) {
      console.error('Full error details:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });

      let errorMessage = 'Failed to save job';

      // Handle validation errors from server
      if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).join('\n');
      }
      // Handle simple error messages
      else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      // Handle client-side errors
      else if (error.message) {
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
    }
  };

  const removeSkill = (list, setList, index) => {
    const newList = [...list];
    newList.splice(index, 1);
    setList(newList);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white rounded-lg shadow-md"
    >
      <h2 className="mb-6 text-2xl font-bold text-gray-800">
        {job ? 'Edit Job Description' : 'Create New Job Description'}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Job Title*</label>
          <input
            {...register('title', { required: 'Job title is required' })}
            className={`w-full px-3 py-2 border rounded-md ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="e.g. Full Stack Developer"
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Describe the role and responsibilities..."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Minimum Experience (years)</label>
            <input
              type="number"
              {...register('minExperience')}
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Employment Type</label>
            <select
              {...register('employmentType')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Salary Range Min</label>
            <input
              type="number"
              {...register('salaryRangeMin')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g. 50000"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Salary Range Max</label>
            <input
              type="number"
              {...register('salaryRangeMax')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g. 80000"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Location</label>
          <input
            {...register('location')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="e.g. Remote, New York, etc."
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Required Skills*</label>
          <div className="flex mb-2 space-x-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Add required skill"
            />
            <button
              type="button"
              onClick={() => addSkill(requiredSkills, setRequiredSkills)}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <FiPlus />
            </button>
          </div>
          {errors.requiredSkills && (
            <p className="mt-1 text-sm text-red-500">{errors.requiredSkills.message}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {requiredSkills.map((skill, index) => (
              <div key={index} className="flex items-center px-3 py-1 text-sm bg-blue-100 rounded-full">
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(requiredSkills, setRequiredSkills, index)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <FiX size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Preferred Skills</label>
          <div className="flex mb-2 space-x-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Add preferred skill"
            />
            <button
              type="button"
              onClick={() => addSkill(preferredSkills, setPreferredSkills)}
              className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              <FiPlus />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferredSkills.map((skill, index) => (
              <div key={index} className="flex items-center px-3 py-1 text-sm bg-green-100 rounded-full">
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(preferredSkills, setPreferredSkills, index)}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  <FiX size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {job && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="block ml-2 text-sm text-gray-700">
              Active Job Posting
            </label>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || requiredSkills.length === 0}
            className={`px-4 py-2 text-white rounded-md ${requiredSkills.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isSubmitting ? 'Saving...' : job ? 'Update Job' : 'Create Job'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default JobDescriptionForm;