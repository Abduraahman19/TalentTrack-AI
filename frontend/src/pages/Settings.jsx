import React from 'react'

const Settings = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <form className="mt-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
          <input type="file" className="block w-full mt-1" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Email Notifications</label>
          <input type="checkbox" className="mt-1" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Account Privacy</label>
          <select className="block w-full mt-1">
            <option>Public</option>
            <option>Private</option>
          </select>
        </div>
        <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
          Save Changes
        </button>
      </form>
    </div>
  )
}

export default Settings
