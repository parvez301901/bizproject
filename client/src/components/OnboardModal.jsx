import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Briefcase, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Phone, 
  ShieldCheck, 
  Award,
  Zap,
  Gift,
  ListChecks,
  Trash2,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../LanguageContext';

const DEFAULT_DEPARTMENTS = [
  'Engineering',
  'Product Design',
  'Operations & Strategy',
  'Marketing & Growth',
  'Customer Success',
  'Human Resources'
];

const SUGGESTED_SKILLS = [
  'React', 'Node.js', 'PostgreSQL', 'Figma', 'TypeScript', 'Docker',
  'Python', 'Project Management', 'Agile Leadership', 'UI/UX', 'Customer Discovery'
];

export default function OnboardModal({ onClose, onCreated }) {
  const { t } = useLanguage();
  // Stepper: 1 = Personal Details, 2 = Role & Department, 3 = Skills & Equipment, 4 = Gamification & Confirmation
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  
  const [role, setRole] = useState('member');
  const [department, setDepartment] = useState('Engineering');
  const [designation, setDesignation] = useState('');

  const [selectedSkills, setSelectedSkills] = useState(['React', 'TypeScript']);
  const [customSkill, setCustomSkill] = useState('');
  
  const toggleSkill = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills(prev => [...prev, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  // Initial Onboarding Tasks & Rewards
  const [onboardingTasks, setOnboardingTasks] = useState([
    { title: 'Personal and emergency contact information verification', category: 'HR', xp: 30 },
    { title: 'Sign employment agreement and company policies', category: 'Legal & HR', xp: 40 },
    { title: 'Setup company credentials, Google Workspace & 2FA', category: 'IT Security', xp: 50 },
    { title: 'Schedule 1-on-1 welcome session with mentor & manager', category: 'Team & Culture', xp: 35 },
    { title: 'Configure workstation tools & software licenses', category: 'IT & Dev', xp: 45 },
    { title: 'Review company mission, project roadmap & team workflows', category: 'Training', xp: 50 }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('General');
  const [newTaskXp, setNewTaskXp] = useState(40);

  const handleAddOnboardingTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setOnboardingTasks(prev => [
      ...prev,
      {
        title: newTaskTitle.trim(),
        category: newTaskCategory,
        xp: Number(newTaskXp) || 35
      }
    ]);
    setNewTaskTitle('');
  };

  const handleRemoveOnboardingTask = (index) => {
    setOnboardingTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!fullName.trim() || !email.trim()) {
        setError('Please provide full name and valid business email.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!designation.trim()) {
        setError('Please provide a job title or role designation.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');

    try {
      await api.onboardUser({
        full_name: fullName.trim(),
        email: email.trim(),
        role,
        department,
        designation: designation.trim() || 'Team Member',
        phone: phone.trim(),
        location: location.trim(),
        skills: selectedSkills,
        custom_checklists: onboardingTasks
      });

      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[92vh]">
        {/* Header with Progress Steps */}
        <div className="p-6 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-slate-50 border-b border-emerald-100/80 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interactive Employee Onboarding Stepper</span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Step {step} of 4: {
              step === 1 ? 'Personal Profile & Contact' :
              step === 2 ? 'Department & Position' :
              step === 3 ? 'Skills & Tech Stack' : 'Gamification & Welcome'
            }
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Guided one-by-one employee onboarding with automated milestones and XP initialization.
          </p>

          {/* Stepper Dots Bar */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="space-y-1">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    s < step ? 'bg-emerald-600' : s === step ? 'bg-emerald-500 shadow-xs' : 'bg-slate-200'
                  }`} 
                />
                <span className={`text-[10px] font-medium block truncate text-center ${s === step ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  {s === 1 ? 'Personal' : s === 2 ? 'Role' : s === 3 ? 'Skills' : 'Welcome'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Forms */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-3.5 animate-fadeIn">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Employee Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. David Miller"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Corporate Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="david.miller@company.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555-0199"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Work Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. New York, Remote"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Department & Position */}
          {step === 2 && (
            <div className="space-y-3.5 animate-fadeIn">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  {DEFAULT_DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Role Designation / Job Title *</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">System Permission Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'member', label: 'Team Member', desc: 'Manage assigned tasks' },
                    { id: 'manager', label: 'Team Lead / Manager', desc: 'Oversee projects' },
                    { id: 'admin', label: 'Administrator', desc: 'Full workspace access' },
                    { id: 'guest', label: 'Guest / Contractor', desc: 'Limited review' },
                  ].map(r => (
                    <div
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        role === r.id ? 'border-emerald-500 bg-emerald-50/50 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-semibold text-slate-800">{r.label}</p>
                      <p className="text-[10px] text-slate-500">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Skills & Tech Stack */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Verified Skills</label>
                <p className="text-[11px] text-slate-500 mb-2">Click tags to attach skills to the employee profile:</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_SKILLS.map(s => {
                    const isSelected = selectedSkills.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSkill(s)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Add Custom Skill</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="e.g. AWS, GraphQL, Rust"
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Gamification & Summary */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                  <span className="font-bold text-sm">Gamification Ready: Starter XP Bonus</span>
                </div>
                <p className="text-xs text-emerald-50 leading-relaxed">
                  Every task and onboarding checklist completed will award <strong>XP</strong> to level up this employee and boost morale!
                </p>
                <div className="flex items-center gap-3 pt-2 text-xs font-semibold">
                  <span className="bg-white/20 px-2.5 py-1 rounded-lg">Level 1 Novice</span>
                  <span className="bg-white/20 px-2.5 py-1 rounded-lg">+35 XP per milestone</span>
                  <span className="bg-white/20 px-2.5 py-1 rounded-lg">+150 XP Graduation bonus</span>
                </div>
              </div>

              {/* Interactive Initial Onboarding Tasks & Rewards List */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      {t('onboardModal.initialTasksHeader')} ({onboardingTasks.length})
                    </h4>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                    {t('onboardModal.autoAssignedBadge')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {t('onboardModal.initialTasksSubtitle')}
                </p>

                {/* List of current tasks */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {onboardingTasks.map((tItem, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">{tItem.title}</span>
                        <span className="text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.2 rounded shrink-0">
                          {tItem.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          +{tItem.xp} XP
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOnboardingTask(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                          title="Remove task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Custom Task Form */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder={t('onboardModal.newOnboardingTaskPlaceholder')}
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 focus:bg-white w-full"
                  />
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <select
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-slate-600 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="HR">HR</option>
                      <option value="IT Security">IT Security</option>
                      <option value="IT & Dev">IT & Dev</option>
                      <option value="Training">Training</option>
                      <option value="Culture">Culture</option>
                      <option value="General">General</option>
                    </select>
                    <select
                      value={newTaskXp}
                      onChange={(e) => setNewTaskXp(Number(e.target.value))}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-slate-600 focus:outline-none focus:border-emerald-500"
                    >
                      <option value={25}>+25 XP</option>
                      <option value={35}>+35 XP</option>
                      <option value={50}>+50 XP</option>
                      <option value={100}>+100 XP</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddOnboardingTask}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer shadow-2xs"
                    >
                      {t('onboardModal.addInitialTaskBtn')}
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-800">Onboarding Candidate Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div><span className="text-slate-400">Name:</span> {fullName}</div>
                  <div><span className="text-slate-400">Email:</span> {email}</div>
                  <div><span className="text-slate-400">Department:</span> {department}</div>
                  <div><span className="text-slate-400">Designation:</span> {designation}</div>
                  <div><span className="text-slate-400">Role:</span> {role}</div>
                  <div><span className="text-slate-400">Location:</span> {location || 'Remote'}</div>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400">Skills ({selectedSkills.length}):</span>{' '}
                  <span className="font-medium text-slate-700">{selectedSkills.join(', ')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(prev => prev - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="px-6 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Creating Candidate...' : 'Complete & Launch Onboarding'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
