'use client'
import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './calendar.module.css';
import { useAuth } from '@/app/hooks/useAuth';
import { useQuery } from '@apollo/client';
import { GET_USERS_BY_COMPANY } from '@/app/graphql/user';
import { GET_EVENTS_BY_MONTH } from '@/app/graphql/events';

const localizer = momentLocalizer(moment);

export default function CalendarEvents() {
  const { user, token } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentView, setCurrentView] = useState('month');
  const [companyId, setCompanyId] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date(),
  });

  // Set company ID when user is available
  useEffect(() => {
    if (user?.company?.id) {
      console.log('✅ Setting company ID:', user.company.id);
      setCompanyId(user.company.id);
    }
  }, [user]);

  // GraphQL query to fetch events by month
  const { data: eventsData, loading: eventsLoading, error: eventsError, refetch: refetchEvents } = useQuery(
    GET_EVENTS_BY_MONTH,
    {
      variables: { date: currentDate },
      skip: !token,
      context: {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      },
      errorPolicy: 'all',
      onCompleted: (data) => {
        console.log('✅ Events query completed successfully:', data);
      },
      onError: (error) => {
        console.log('❌ Events query error:', error);
      }
    }
  );

  // GraphQL query to fetch users by company
  const { data: usersData, loading: usersLoading, error: usersError } = useQuery(
    GET_USERS_BY_COMPANY,
    {
      skip: !token || !companyId,
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
        console.log('✅ Users query completed successfully:', data);
      },
      onError: (error) => {
        console.log('❌ Users query error:', error);
      }
    }
  );

  // State for create event loading
  const [createEventLoading, setCreateEventLoading] = useState(false);

  // Transform GraphQL events data for calendar
const events = eventsData?.EventByMonth 
  ? eventsData.EventByMonth.map(event => {
      const start = moment.utc(event.date).local().toDate();
      const end = moment.utc(event.date).add(1, 'hour').local().toDate();

      return {
        id: event.id,
        title: event.title || 'Untitled Event',
        start,
        end,
        description: event.description || '',
      };
    })
  : [];



  // Get events for the current month for the sidebar
  const getCurrentMonthEvents = () => {
    if (!eventsData?.EventByMonth) return [];
    
    const currentMonthStart = moment(currentDate).startOf('month');
    const currentMonthEnd = moment(currentDate).endOf('month');
    
    return eventsData.EventByMonth
      .filter(event => {
      const eventDate = moment.utc(event.date).local();
      return eventDate.isBetween(currentMonthStart, currentMonthEnd, null, '[]');
    })
      .sort((a, b) => moment(a.date).diff(moment(b.date)))
      .map(event => ({
        id: event.id,
        title: event.title || 'Untitled Event',
        start: event.date ? new Date(event.date) : new Date(),
        description: event.description || '',
        createdBy: event.createdBy?.username || 'Not created by anyone'
      }));
  };

  const currentMonthEvents = getCurrentMonthEvents();

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };
  
  const closeEventDetails = () => {
    setSelectedEvent(null);
  };
  
  const handleNavigate = (newDate) => {
    console.log('📅 Navigating to new date:', newDate);
    setCurrentDate(newDate);
    
    // Refetch events for the new month
    refetchEvents({
      date: newDate
    });
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
    
    setCreateEventLoading(true);
    
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
      });
      
      // Refetch events for current month
      refetchEvents({
        date: currentDate
      });
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event: ' + error.message);
    } finally {
      setCreateEventLoading(false);
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

  const eventStyleGetter = (event, start, end, isSelected) => {
  return {
    style: {
      backgroundColor: '#000000',
      color: '#ffffff',
      border: isSelected ? '3px solid #555555' : '2px solid #000000',
      borderRadius: '6px',
      padding: '4px 8px',
      fontSize: '0.9rem',
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

  // Determine loading and error states
  const loading = eventsLoading || usersLoading;
  const error = eventsError || usersError;

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
                disabled={loading}
              >
                + Add Event
              </button>
            )}
          </div>
          
          {eventsLoading && <div className={styles.loading}>Loading events...</div>}
          {eventsError && <div className={styles.error}>Error: {eventsError.message}</div>}
          
          <div className={styles.customCalendarWrapper}>
            <div style={{ marginBottom: '1rem', fontWeight: 500 }}>
  Viewing: {currentView.charAt(0).toUpperCase() + currentView.slice(1)} View
</div>

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
              onView={(view) => setCurrentView(view)}

              tooltipAccessor={(event) => `${event.title}\n${event.description || ''}`}
              
            />
          </div>
        </div>
        
        <div className={styles.upcomingEventsSection}>
          <div className={styles.sectionHeader}>
            <h2>Events in {moment(currentDate).format('MMMM YYYY')}</h2>
          </div>
          {eventsLoading ? (
            <div className={styles.loading}>Loading events...</div>
          ) : eventsError ? (
            <div className={styles.error}>Error loading events</div>
          ) : currentMonthEvents.length === 0 ? (
            <p className={styles.noEvents}>No events this month.</p>
          ) : (
            <div className={styles.eventsList}>
              {currentMonthEvents.map(event => (
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
                    👤 {event.createdBy}
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
            {selectedEvent.createdBy && (
              <div className={styles.detailsSection}>
                <div className={styles.detailsLabel}>Created By:</div>
                <div className={styles.detailsContent}>{selectedEvent.createdBy}</div>
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

      {/* New Event Modal */}
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
                disabled={createEventLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateEvent}
                className={styles.saveButton}
                disabled={!newEvent.title.trim() || createEventLoading}
              >
                {createEventLoading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}