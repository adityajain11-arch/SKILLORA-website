import React, { useState } from 'react';
import { UserProfile, Internship } from '../types';
import { User, GraduationCap, FileText, Sparkles, Check, Edit2, Plus, X, Award, ExternalLink, Save } from 'lucide-react';
import { fireCelebrationConfetti } from '../utils/confetti';

interface ProfileViewProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  internships: Internship[];
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  setUserProfile,
  internships
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(userProfile);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [simulatedInternshipId, setSimulatedInternshipId] = useState(internships[0]?.id || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    if (!formData.skills.includes(newSkillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkillInput.trim()]
      });
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill)
    });
  };

  const handleSaveProfile = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('workvanta_auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/user-profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setUserProfile(data.data);
        setIsEditing(false);
        setSaveSuccess(true);
        fireCelebrationConfetti();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const simulatedRole = internships.find((i) => i.id === simulatedInternshipId) || internships[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] cozy-card-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-[#7C6CF0] to-[#FF8A65] p-1 shadow-md shrink-0">
            <div className="w-full h-full rounded-2xl bg-[#FFF8F0] dark:bg-[#1E1A2C] flex items-center justify-center text-[#7C6CF0] dark:text-[#A99CFF]">
              <User className="w-9 h-9" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF] uppercase tracking-wider">
                Workvanta Candidate Profile
              </span>
              <span className="text-[#34D399] font-bold text-xs bg-[#34D399]/15 px-2.5 py-0.5 rounded-full">
                Active Candidate
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#2D2A3E] dark:text-[#F2EEFF] mt-1">
              {userProfile.name}
            </h2>
            <p className="text-xs text-[#6B6880] dark:text-[#A5A0BA] font-medium">
              {userProfile.university} · {userProfile.major} · Class of {userProfile.gradYear} (GPA: {userProfile.gpa})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <button
              onClick={handleSaveProfile}
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#7C6CF0] hover:bg-[#6a59e6] text-white shadow-md flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Workvanta Profile</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/25 text-[#7C6CF0] dark:text-[#A99CFF] hover:bg-[#7C6CF0]/10 transition-colors flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile & Preferences</span>
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-[#34D399]/15 border border-[#34D399]/30 text-xs font-semibold text-[#006949] dark:text-[#5EE3B0] flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Your student sanctuary profile and skills have been successfully updated!</span>
        </div>
      )}

      {/* Profile Details & Role Match Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Profile Information & Skills */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Bio & Education Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] cozy-card-shadow space-y-4">
            <h3 className="text-base font-bold text-[#2D2A3E] dark:text-[#F2EEFF] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#7C6CF0] dark:text-[#A99CFF]" />
              Personal Ethos & Background
            </h3>

            {isEditing ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Bio & Story</label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">University</label>
                    <input
                      type="text"
                      value={formData.university}
                      onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Major</label>
                    <input
                      type="text"
                      value={formData.major}
                      onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#474554] dark:text-[#A5A0BA] leading-relaxed">
                {userProfile.bio}
              </p>
            )}
          </div>

          {/* Skills & Strengths */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] cozy-card-shadow space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                Verified Skills & Passions
              </h3>
              <span className="text-xs text-[#6B6880] dark:text-[#A5A0BA]">
                {formData.skills.length} skills listed
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#7C6CF0]/10 text-[#5846ca] dark:text-[#c7bfff] flex items-center gap-1.5"
                >
                  <span>{skill}</span>
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-[#ba1a1a]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {isEditing && (
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add a new skill (e.g. Next.js, WebGL, Rust)..."
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#7C6CF0] text-white"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Synced Resume & Links Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] cozy-card-shadow space-y-4">
            <h3 className="text-base font-bold text-[#2D2A3E] dark:text-[#F2EEFF] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#7C6CF0] dark:text-[#A99CFF]" />
              Synced Resume & Public Profiles
            </h3>

            <div className="p-4 rounded-2xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 dark:border-[#3D3759] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#7C6CF0]/15 text-[#7C6CF0] dark:text-[#A99CFF] flex items-center justify-center font-bold">
                  PDF
                </div>
                <div>
                  <div className="text-sm font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                    {userProfile.uploadedResumeName}
                  </div>
                  <div className="text-xs text-[#34D399] font-medium">
                    Verified for Summer 2026 Cohort
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  const updated = prompt('Update resume filename:', userProfile.uploadedResumeName);
                  if (updated) {
                    setFormData({ ...formData, uploadedResumeName: updated });
                    setUserProfile({ ...userProfile, uploadedResumeName: updated });
                  }
                }}
                className="text-xs font-semibold text-[#7C6CF0] dark:text-[#A99CFF] hover:underline"
              >
                Replace
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <a
                href={userProfile.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-[#FFF8F0]/70 dark:bg-[#1E1A2C] border border-[#7C6CF0]/10 flex items-center justify-between hover:text-[#7C6CF0]"
              >
                <span>Portfolio: {userProfile.portfolioUrl}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#6B6880]" />
              </a>

              <a
                href={userProfile.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-[#FFF8F0]/70 dark:bg-[#1E1A2C] border border-[#7C6CF0]/10 flex items-center justify-between hover:text-[#7C6CF0]"
              >
                <span>GitHub: {userProfile.githubUrl}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#6B6880]" />
              </a>
            </div>
          </div>

        </div>

        {/* Right Column: Live Match Simulator */}
        <div className="lg:col-span-5 p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] cozy-card-shadow space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#FF8A65]" />
              Interactive Match Simulator
            </div>
            <h3 className="text-lg font-bold text-[#2D2A3E] dark:text-[#F2EEFF] mt-1">
              Test Profile Match Against Any Role
            </h3>
            <p className="text-xs text-[#6B6880] dark:text-[#A5A0BA] mt-0.5">
              See why companies match with your background and get gentle suggestions to boost your confidence.
            </p>
          </div>

          {/* Select Target Role */}
          <div>
            <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1.5">
              Select Internship Role to Simulate:
            </label>
            <select
              value={simulatedInternshipId}
              onChange={(e) => setSimulatedInternshipId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none"
            >
              {internships.map((role) => (
                <option key={role.id} value={role.id} className="dark:bg-[#1E1A2C]">
                  {role.company} — {role.title} ({role.category})
                </option>
              ))}
            </select>
          </div>

          {/* Simulation Output Card */}
          {simulatedRole && (
            <div className="p-5 rounded-2xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 dark:border-[#3D3759] space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF]">
                  {simulatedRole.company} Compatibility
                </div>
                <div className="text-lg font-extrabold text-[#34D399] dark:text-[#5EE3B0] tabular-nums">
                  {simulatedRole.matchScore}% Strong Fit
                </div>
              </div>

              <div className="h-2 w-full bg-[#7C6CF0]/15 rounded-full overflow-hidden">
                <div
                  style={{ width: `${simulatedRole.matchScore}%` }}
                  className="h-full bg-gradient-to-r from-[#7C6CF0] to-[#FF8A65] rounded-full"
                />
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/10 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">Skills Overlap: </span>
                    <span className="text-[#474554] dark:text-[#A5A0BA]">
                      Your {formData.skills.slice(0, 3).join(', ')} experience matches their {simulatedRole.noJargonSkills[0]} criteria!
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/10 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#FF8A65] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">Culture Alignment: </span>
                    <span className="text-[#474554] dark:text-[#A5A0BA]">
                      {simulatedRole.company} prioritizes {simulatedRole.culturePillars[0]}. Your approachable student portfolio is exactly what they seek.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/10 flex items-start gap-2.5">
                  <Award className="w-4 h-4 text-[#7C6CF0] dark:text-[#A99CFF] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">Remote Location: </span>
                    <span className="text-[#474554] dark:text-[#A5A0BA]">
                      100% Remote ({simulatedRole.location}) with async flexibility.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
