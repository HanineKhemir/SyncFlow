'use client'
import React, { useState } from 'react';
import './team.css';

const TeamsDashboard = () => {
  // Sample team data - replace with actual API calls
  const [teams, setTeams] = useState([
    { id: 1, name: 'Design Team', members: 5, description: 'UI/UX design for web and mobile applications' },
    { id: 2, name: 'Development Team', members: 8, description: 'Frontend and backend development across platforms' },
    { id: 3, name: 'Marketing Team', members: 4, description: 'Digital marketing campaigns and social media management' },
    { id: 55, name: 'Marketing Team', members: 4, description: 'Digital marketing campaigns and social media management' },
    { id: 4, name: 'Marketing Team', members: 4, description: 'Digital marketing campaigns and social media management' },
    { id: 9, name: 'Marketing Team', members: 4, description: 'Digital marketing campaigns and social media management' },
    
  ]);

  // Modal states
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form states
  const [teamCodeInput, setTeamCodeInput] = useState('');
  const [newTeamInput, setNewTeamInput] = useState({
    name: '',
    description: ''
  });

  // Handlers
  const handleJoinTeam = (e) => {
    e.preventDefault();
    // Process team joining logic here
    console.log("Joining team with code:", teamCodeInput);
    setShowJoinModal(false);
    setTeamCodeInput('');
  };

  const handleCreateTeam = (e) => {
    e.preventDefault();
    // Process team creation logic here
    console.log("Creating new team:", newTeamInput);
    
    // Add new team to the list (temporary for demo)
    const newTeam = {
      id: teams.length + 1,
      name: newTeamInput.name,
      members: 1,
      description: newTeamInput.description
    };
    
    setTeams([...teams, newTeam]);
    setShowCreateModal(false);
    setNewTeamInput({ name: '', description: '' });
  };

  return (
    <div className="container">
      <h1 className="heading">Your Teams</h1>
      
      <div className="button-container">
        <button 
          className="button" 
          onClick={() => setShowJoinModal(true)}
        >
          Join Team
        </button>
        <button 
          className="button" 
          onClick={() => setShowCreateModal(true)}
        >
          Create Team
        </button>
      </div>

      {teams.length > 0 ? (
        <div className="team-grid">
          {teams.map(team => (
            <div key={team.id} className="team-card">
              <h3 className="team-name">{team.name}</h3>
              <p className="team-members">{team.members} members</p>
              <p className="team-description">{team.description}</p>
              <button className="view-button">View Details</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>You haven't joined any teams yet.</p>
          <p>Join an existing team or create a new one to get started!</p>
        </div>
      )}

      {/* Join Team Modal */}
      {showJoinModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">Join a Team</h2>
            <form onSubmit={handleJoinTeam}>
              <div className="form-group">
                <label className="label">Team Code</label>
                <input
                  type="text"
                  className="input"
                  value={teamCodeInput}
                  onChange={(e) => setTeamCodeInput(e.target.value)}
                  placeholder="Enter team code"
                  required
                />
              </div>
              <div className="modal-buttons">
                <button type="button" className="cancel-button" onClick={() => setShowJoinModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  Join Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">Create a New Team</h2>
            <form onSubmit={handleCreateTeam}>
              <div className="form-group">
                <label className="label">Team Name</label>
                <input
                  type="text"
                  className="input"
                  value={newTeamInput.name}
                  onChange={(e) => setNewTeamInput({...newTeamInput, name: e.target.value})}
                  placeholder="Enter team name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Team Description</label>
                <textarea
                  className="textarea"
                  value={newTeamInput.description}
                  onChange={(e) => setNewTeamInput({...newTeamInput, description: e.target.value})}
                  placeholder="Enter team description"
                  rows="4"
                  required
                />
              </div>
              <div className="modal-buttons">
                <button type="button" className="cancel-button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsDashboard;