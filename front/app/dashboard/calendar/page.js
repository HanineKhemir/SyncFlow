'use client'
import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './calendar.module.css';
import { useAuth } from '@/app/hooks/useAuth';
import { useQuery } from '@apollo/client';
import { GET_USERS_BY_COMPANY } from '@/app/graphql/user';

const localizer = momentLocalizer(moment);

export default function CalendarEvents() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date(),
    assignedUserId: ''
  });

  // Set company ID when user is available
  useEffect(() => {
    if (user?.company?.id) {
      console.log('✅ Setting company ID:', user.company.id);
      setCompanyId(user.company.id);
    }
  }, [user]);

  // GraphQL query to fetch users by company
  const { data: usersData, loading: usersLoading, error: usersError } = useQuery(
    GET_USERS_BY_COMPANY,
   {
    skip: !token || !companyId, // Skip query if not authenticated or no companyId
    variables: {
      companyId: companyId
    },
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    },
    errorPolicy: 'all',
    onCompleted: (data) => {
      console.log('✅ Query completed successfully:', data);
    },
    onError: (error) => {
      console.log('❌ Query error:', error);
    }
  }
    
  );

  useEffect(() => {
    if (token) {
      fetchEvents();
    }
  }, [currentDate, token]);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/events', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const eventsData = await response.json();
      
      // Safely transform the data even if empty
      console.log(eventsData)
      const formattedEvents = Array.isArray(eventsData) 
        ? eventsData.map(event => ({
            id: event.id,
            title: event.title || 'Untitled Event',
            start: event.date ? new Date(event.date) : new Date(),
            end: event.date ? new Date(new Date(event.date).getTime() + (event.duration || 60 * 60 * 1000)) : new Date(Date.now() + 60 * 60 * 1000),
            description: event.description || '',
            assignedUser: event.user.username || 'Not assigned'
          }))
        : [];
      
      setEvents(formattedEvents);
      updateUpcomingEvents(formattedEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
      setEvents([]);
      setUpcomingEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const updateUpcomingEvents = (eventsList) => {
    const today = moment().startOf('day');
    const nextWeek = moment().add(7, 'days').endOf('day');
    
    const upcoming = Array.isArray(eventsList)
      ? eventsList
          .filter(event => {
            try {
              const eventDate = moment(event.start);
              return eventDate.isValid() && eventDate.isAfter(today) && eventDate.isBefore(nextWeek);
            } catch {
              return false;
            }
          })
          .sort((a, b) => moment(a.start).diff(moment(b.start)))
      : [];
      
    setUpcomingEvents(upcoming);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };
  
  const closeEventDetails = () => {
    setSelectedEvent(null);
  };
  
  const handleNavigate = (newDate) => {
    setCurrentDate(newDate);
  };

  const handleCreateEvent = async () => {
    if (!user) {
      alert('Please login to create events');
      return;
    }
    
    if (!newEvent.title.trim()) {
      alert('Please enter a title for the event');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3000/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          date: newEvent.date.toISOString(),
          assignedUserId: newEvent.assignedUserId || null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create event');
      }
      
      setShowEventModal(false);
      // Reset form
      setNewEvent({
        title: '',
        description: '',
        date: new Date(),
        assignedUserId: ''
      });
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      setError(error.message);
    }
  };

  const handleNewEventChange = (field, value) => {
    setNewEvent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectSlot = (slotInfo) => {
    setNewEvent(prev => ({
      ...prev,
      date: slotInfo.start
    }));
    setShowEventModal(true);
  };

  const eventStyleGetter = () => {
    return {
      style: {
        backgroundColor: '#ffffff',
        color: '#000000',
        border: '2px solid #000000',
        borderRadius: '0',
      }
    };
  };
  
  const formatEventTime = (date) => {
    return moment(date).isValid() ? moment(date).format('h:mm A') : 'Invalid time';
  };
  
  const formatEventDate = (date) => {
    return moment(date).isValid() ? moment(date).format('dddd, MMMM D') : 'Invalid date';
  };

  // Get company users for dropdown
  const companyUsers = usersData?.usersByCompany || [];

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1>Event Calendar</h1>
        <div className={styles.currentDate}>
          {moment().format('dddd, MMMM D, YYYY')}
        </div>
      </header>
      
      <div className={styles.contentWrapper}>
        <div className={styles.calendarSection}>
          <div className={styles.sectionHeader}>
            <h2>Calendar</h2>
            {user && (
              <button 
                className={styles.addEventButton}
                onClick={() => setShowEventModal(true)}
              >
                + Add Event
              </button>
            )}
          </div>
          
          {loading && <div className={styles.loading}>Loading events...</div>}
          {error && <div className={styles.error}>Error: {error}</div>}
          
          <div className={styles.customCalendarWrapper}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500 }}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable={true}
              onNavigate={handleNavigate}
              eventPropGetter={eventStyleGetter}
              views={['month', 'week', 'day']}
              defaultView="month"
              date={currentDate}
            />
          </div>
        </div>
        
        <div className={styles.upcomingEventsSection}>
          <div className={styles.sectionHeader}>
            <h2>Upcoming Events</h2>
          </div>
          {loading ? (
            <div className={styles.loading}>Loading upcoming events...</div>
          ) : error ? (
            <div className={styles.error}>Error loading upcoming events</div>
          ) : upcomingEvents.length === 0 ? (
            <p className={styles.noEvents}>No upcoming events in the next 7 days.</p>
          ) : (
            <div className={styles.eventsList}>
              {upcomingEvents.map(event => (
                <div 
                  key={event.id} 
                  className={styles.eventCard}
                  onClick={() => handleSelectEvent(event)}
                >
                  <div className={styles.eventDate}>{formatEventDate(event.start)}</div>
                  <div className={styles.eventTime}>
                    {formatEventTime(event.start)}
                  </div>
                  <h3 className={styles.eventTitle}>{event.title}</h3>
                  <div className={styles.eventAssigned}>
                    👤 {event.assignedUser}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {selectedEvent && (
        <div className={styles.eventDetailsOverlay}>
          <div className={styles.eventDetailsCard}>
            <button className={styles.closeButton} onClick={closeEventDetails}>×</button>
            <h2 className={styles.detailsTitle}>{selectedEvent.title}</h2>
            <div className={styles.detailsSection}>
              <div className={styles.detailsLabel}>Date & Time:</div>
              <div className={styles.detailsContent}>
                {formatEventDate(selectedEvent.start)}, {formatEventTime(selectedEvent.start)}
              </div>
            </div>
            {selectedEvent.assignedUser && (
              <div className={styles.detailsSection}>
                <div className={styles.detailsLabel}>Assigned To:</div>
                <div className={styles.detailsContent}>{selectedEvent.assignedUser}</div>
              </div>
            )}
            {selectedEvent.description && (
              <div className={styles.detailsSection}>
                <div className={styles.detailsLabel}>Description:</div>
                <div className={styles.detailsContent}>{selectedEvent.description}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Event Modal - Simplified */}
      {showEventModal && (
        <div className={styles.eventDetailsOverlay}>
          <div className={styles.eventDetailsCard}>
            <button className={styles.closeButton} onClick={() => setShowEventModal(false)}>×</button>
            <h2 className={styles.detailsTitle}>Create New Event</h2>
            
            <div className={styles.detailsSection}>
              <label className={styles.detailsLabel}>Title *</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => handleNewEventChange('title', e.target.value)}
                className={styles.inputField}
                placeholder="Enter event title"
                required
              />
            </div>
            
            <div className={styles.detailsSection}>
              <label className={styles.detailsLabel}>Date & Time</label>
              <input
                type="datetime-local"
                value={moment(newEvent.date).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => handleNewEventChange('date', new Date(e.target.value))}
                className={styles.inputField}
              />
            </div>
            
            <div className={styles.detailsSection}>
              <label className={styles.detailsLabel}>Assign to User</label>
              {usersLoading ? (
                <div className={styles.loading}>Loading users...</div>
              ) : usersError ? (
                <div className={styles.error}>Error loading users: {usersError.message}</div>
              ) : (
                <select
                  value={newEvent.assignedUserId}
                  onChange={(e) => handleNewEventChange('assignedUserId', e.target.value)}
                  className={styles.selectField}
                >
                  <option value="">Select a user (optional)</option>
                  {companyUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.role})
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div className={styles.detailsSection}>
              <label className={styles.detailsLabel}>Description</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => handleNewEventChange('description', e.target.value)}
                className={styles.textareaField}
                rows={4}
                placeholder="Enter event description (optional)"
              />
            </div>
            
            <div className={styles.modalActions}>
              <button 
                onClick={() => setShowEventModal(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateEvent}
                className={styles.saveButton}
                disabled={!newEvent.title.trim()}
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}