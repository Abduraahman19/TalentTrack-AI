import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import MobileHeader from '../components/Layout/MobileHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSave, FiCheck, FiX, FiUpload, FiBell, FiLock, FiMoon, FiGlobe, FiUser, FiMail, FiEye, FiEyeOff } from 'react-icons/fi';

const Settings = () => {
  const [settings, setSettings] = useState({
    profilePicture: null,
    emailNotifications: true,
    pushNotifications: true,
    accountPrivacy: 'Public',
    theme: 'light',
    language: 'en',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showPasswords: false
  });

  const [saveStatus, setSaveStatus] = useState('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [imagePreview, setImagePreview] = useState(null);

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Simulate fetching user data
      setSettings(prev => ({
        ...prev,
        email: 'user@example.com',
        profilePicture: null
      }));
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setSettings({...settings, [name]: checked});
    } else {
      setSettings({...settings, [name]: value});
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setSettings({...settings, profilePicture: file});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus('saving');
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSaveStatus('success');
      
      // Reset success status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      
      // Reset error status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const togglePasswordVisibility = () => {
    setSettings({...settings, showPasswords: !settings.showPasswords});
  };

  if (isLoading) {
    return (
      <Layout>
        <MobileHeader />
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent"
          ></motion.div>
        </div>
      </Layout>
    );
  }

  const tabItems = [
    { id: 'profile', label: 'Profile', icon: <FiUser /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
    { id: 'privacy', label: 'Privacy & Security', icon: <FiLock /> },
    { id: 'appearance', label: 'Appearance', icon: <FiMoon /> },
    { id: 'language', label: 'Language', icon: <FiGlobe /> }
  ];

  return (
    <Layout>
      <MobileHeader />
      <div className="px-10 py-10 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="mb-2 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Settings
          </h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div 
          className="flex mb-8 overflow-x-auto border-b border-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </motion.div>

        <form onSubmit={handleSubmit} className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="flex items-center text-xl font-semibold text-gray-800">
                    <FiUser className="mr-2 text-blue-500" />
                    Profile Information
                  </h2>
                  
                  <div className="flex flex-col items-center md:flex-row md:items-start">
                    <div className="relative mb-4 md:mb-0 md:mr-8">
                      <div className="w-24 h-24 overflow-hidden border-2 border-white rounded-full shadow-lg bg-gradient-to-r from-blue-100 to-purple-100">
                        {imagePreview ? (
                          <img 
                            src={imagePreview} 
                            alt="Profile" 
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <span className="text-3xl font-bold text-gray-600">
                              {settings.email ? settings.email.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <label htmlFor="profile-upload" className="absolute flex items-center justify-center w-8 h-8 transition-all duration-200 bg-blue-500 rounded-full cursor-pointer -bottom-1 -right-1 hover:bg-blue-600">
                        <FiUpload className="w-4 h-4 text-white" />
                        <input 
                          id="profile-upload" 
                          name="profilePicture" 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={settings.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your email"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">Current Password</label>
                          <div className="relative">
                            <input
                              type={settings.showPasswords ? "text" : "password"}
                              name="currentPassword"
                              value={settings.currentPassword}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 pr-10 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Current password"
                            />
                            <button
                              type="button"
                              onClick={togglePasswordVisibility}
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                            >
                              {settings.showPasswords ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">New Password</label>
                          <div className="relative">
                            <input
                              type={settings.showPasswords ? "text" : "password"}
                              name="newPassword"
                              value={settings.newPassword}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 pr-10 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="New password"
                            />
                            <button
                              type="button"
                              onClick={togglePasswordVisibility}
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                            >
                              {settings.showPasswords ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={settings.showPasswords ? "text" : "password"}
                            name="confirmPassword"
                            value={settings.confirmPassword}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 pr-10 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                          >
                            {settings.showPasswords ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="flex items-center text-xl font-semibold text-gray-800">
                    <FiBell className="mr-2 text-blue-500" />
                    Notification Preferences
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 transition-all duration-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1 mr-4">
                        <h3 className="font-medium text-gray-800">Email Notifications</h3>
                        <p className="text-sm text-gray-500">Receive emails for important updates</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="emailNotifications"
                          className="sr-only peer" 
                          checked={settings.emailNotifications}
                          onChange={handleInputChange}
                        />
                        <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 transition-all duration-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1 mr-4">
                        <h3 className="font-medium text-gray-800">Push Notifications</h3>
                        <p className="text-sm text-gray-500">Receive push notifications on your device</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="pushNotifications"
                          className="sr-only peer" 
                          checked={settings.pushNotifications}
                          onChange={handleInputChange}
                        />
                        <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 transition-all duration-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1 mr-4">
                        <h3 className="font-medium text-gray-800">Candidate Matching Alerts</h3>
                        <p className="text-sm text-gray-500">Get notified when new candidates match your job requirements</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={true}
                          readOnly
                        />
                        <div className="w-12 h-6 bg-blue-600 rounded-full"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy & Security Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="flex items-center text-xl font-semibold text-gray-800">
                    <FiLock className="mr-2 text-blue-500" />
                    Privacy & Security
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Account Privacy</label>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        {['Public', 'Private', 'Team Only'].map((option) => (
                          <label 
                            key={option} 
                            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                              settings.accountPrivacy === option 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="accountPrivacy"
                              value={option}
                              checked={settings.accountPrivacy === option}
                              onChange={handleInputChange}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-3 font-medium text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                      <p className="mt-3 text-sm text-gray-500">
                        {settings.accountPrivacy === 'Public' 
                          ? 'Anyone in your organization can see your profile' 
                          : settings.accountPrivacy === 'Private'
                          ? 'Only you can see your profile information'
                          : 'Only team members can see your profile'
                        }
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 transition-all duration-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1 mr-4">
                        <h3 className="font-medium text-gray-800">Data Export</h3>
                        <p className="text-sm text-gray-500">Request a copy of your personal data</p>
                      </div>
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-blue-600 transition-colors duration-200 rounded-lg bg-blue-50 hover:bg-blue-100"
                      >
                        Request Data
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 transition-all duration-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1 mr-4">
                        <h3 className="font-medium text-gray-800">Account Deactivation</h3>
                        <p className="text-sm text-gray-500">Temporarily deactivate your account</p>
                      </div>
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-red-600 transition-colors duration-200 rounded-lg bg-red-50 hover:bg-red-100"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="flex items-center text-xl font-semibold text-gray-800">
                    <FiMoon className="mr-2 text-blue-500" />
                    Appearance
                  </h2>
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Theme</label>
                      <div className="relative">
                        <select 
                          name="theme"
                          value={settings.theme}
                          onChange={handleInputChange}
                          className="block w-full px-4 py-3 pr-10 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="system">System Default</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Font Size</label>
                      <div className="relative">
                        <select 
                          className="block w-full px-4 py-3 pr-10 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          defaultValue="medium"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Density</label>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {['Comfortable', 'Normal', 'Compact'].map((density) => (
                        <label 
                          key={density} 
                          className="flex items-center p-4 transition-all duration-200 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300"
                        >
                          <input
                            type="radio"
                            name="density"
                            value={density.toLowerCase()}
                            defaultChecked={density === 'Normal'}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-3 font-medium text-gray-700">{density}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Language Tab */}
              {activeTab === 'language' && (
                <div className="space-y-6">
                  <h2 className="flex items-center text-xl font-semibold text-gray-800">
                    <FiGlobe className="mr-2 text-blue-500" />
                    Language & Region
                  </h2>
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Language</label>
                      <div className="relative">
                        <select 
                          name="language"
                          value={settings.language}
                          onChange={handleInputChange}
                          className="block w-full px-4 py-3 pr-10 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                          <option value="zh">中文</option>
                          <option value="ja">日本語</option>
                          <option value="ko">한국어</option>
                          <option value="ar">العربية</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Time Zone</label>
                      <div className="relative">
                        <select 
                          className="block w-full px-4 py-3 pr-10 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          defaultValue="utc-5"
                        >
                          <option value="utc-12">UTC-12:00</option>
                          <option value="utc-8">UTC-08:00 (PST)</option>
                          <option value="utc-5">UTC-05:00 (EST)</option>
                          <option value="utc">UTC±00:00 (GMT)</option>
                          <option value="utc+1">UTC+01:00 (CET)</option>
                          <option value="utc+5.5">UTC+05:30 (IST)</option>
                          <option value="utc+8">UTC+08:00 (CST)</option>
                          <option value="utc+9">UTC+09:00 (JST)</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Date Format</label>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].map((format) => (
                        <label 
                          key={format} 
                          className="flex items-center p-4 transition-all duration-200 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300"
                        >
                          <input
                            type="radio"
                            name="dateFormat"
                            value={format}
                            defaultChecked={format === 'MM/DD/YYYY'}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-3 font-medium text-gray-700">{format}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Save Button with Status */}
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex flex-col items-center justify-between md:flex-row">
              <p className="mb-4 text-sm text-gray-500 md:mb-0">
                Your preferences will be saved automatically when you click the button below.
              </p>
              <motion.button 
                type="submit" 
                disabled={saveStatus === 'saving'}
                className={`px-6 py-3 rounded-lg font-medium text-white transition-all duration-300 flex items-center ${
                  saveStatus === 'saving' 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : saveStatus === 'success'
                    ? 'bg-green-500'
                    : saveStatus === 'error'
                    ? 'bg-red-500'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md hover:shadow-lg'
                }`}
                whileHover={saveStatus === 'idle' ? { scale: 1.02 } : {}}
                whileTap={saveStatus === 'idle' ? { scale: 0.98 } : {}}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 mr-2 border-2 border-white rounded-full border-t-transparent"
                    ></motion.div>
                    Saving...
                  </>
                ) : saveStatus === 'success' ? (
                  <>
                    <FiCheck className="w-5 h-5 mr-2" />
                    Saved Successfully!
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <FiX className="w-5 h-5 mr-2" />
                    Failed to Save
                  </>
                ) : (
                  <>
                    <FiSave className="w-5 h-5 mr-2" />
                    Save Changes
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default Settings