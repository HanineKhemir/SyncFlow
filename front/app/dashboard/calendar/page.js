'use client'
import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './calendar.module.css';


const localizer = momentLocalizer(moment);

export default function CalendarEvents() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  
  useEffect(() => {
    
    const fetchEvents = () => {
    
      const eventsData = [
        {
          id: 1,
          title: 'Project Kickoff Meeting',
          start: moment().add(1, 'days').set({ hour: 10, minute: 0 }).toDate(),
          end: moment().add(1, 'days').set({ hour: 12, minute: 0 }).toDate(),
          location: 'Conference Room A',
          description: 'Initial kickoff meeting for the new client project. All team members are required to attend.',
          participants: ['John Doe', 'Sarah Smith', 'Michael Johnson']
        },
        {
          id: 2,
          title: 'Design Review',
          start: moment().add(3, 'days').set({ hour: 14, minute: 0 }).toDate(),
          end: moment().add(3, 'days').set({ hour: 16, minute: 0 }).toDate(),
          location: 'Design Studio',
          description: 'Review of the latest UI/UX designs for the client dashboard.',
          participants: ['Emily Chen', 'David Wang', 'Sarah Smith']
        },
        {
          id: 3,
          title: 'Team Building Event',
          start: moment().add(5, 'days').set({ hour: 13, minute: 0 }).toDate(),
          end: moment().add(5, 'days').set({ hour: 17, minute: 0 }).toDate(),
          location: 'Central Park',
          description: 'Outdoor team building activities followed by dinner.',
          participants: ['Entire Team']
        },
        {
          id: 4,
          title: 'Client Presentation',
          start: moment().add(7, 'days').set({ hour: 11, minute: 0 }).toDate(),
          end: moment().add(7, 'days').set({ hour: 12, minute: 30 }).toDate(),
          location: 'Client Office',
          description: 'Presenting the first phase of the project to the client.',
          participants: ['John Doe', 'Sarah Smith', 'Michael Johnson', 'Client Team']
        },
        {
          id: 5,
          title: 'Backend Planning Session',
          start: moment().set({ hour: 15, minute: 0 }).toDate(),
          end: moment().set({ hour: 16, minute: 30 }).toDate(),
          location: 'Meeting Room B',
          description: 'Planning the backend architecture for the new features.',
          participants: ['Alex Turner', 'James Wilson']
        },
        {
          id: 6,
          title: 'Weekly Team Standup',
          start: moment().add(2, 'days').set({ hour: 9, minute: 30 }).toDate(),
          end: moment().add(2, 'days').set({ hour: 10, minute: 0 }).toDate(),
          location: 'Zoom Call',
          description: 'Regular team standup to discuss progress and blockers.',
          participants: ['All Team Members']
        },
        {
          id: 7,
          title: 'Product Launch',
          start: moment().add(14, 'days').set({ hour: 10, minute: 0 }).toDate(),
          end: moment().add(14, 'days').set({ hour: 15, minute: 0 }).toDate(),
          location: 'Main Conference Hall',
          description: 'Official launch of our new product line.',
          participants: ['All Staff', 'Press', 'VIP Clients']
        }
      ];
      
      setEvents(eventsData);
      
      
      const today = moment().startOf('day');
      const nextWeek = moment().add(7, 'days').endOf('day');
      
      const upcoming = eventsData
        .filter(event => {
          const eventDate = moment(event.start);
          return eventDate.isAfter(today) && eventDate.isBefore(nextWeek);
        })
        .sort((a, b) => moment(a.start).diff(moment(b.start)));
        
      setUpcomingEvents(upcoming);
    };
    
    fetchEvents();
  }, []);
  
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };
  
  const closeEventDetails = () => {
    setSelectedEvent(null);
  };
  
 
  const eventStyleGetter = (event) => {
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
    return moment(date).format('h:mm A');
  };
  
  const formatEventDate = (date) => {
    return moment(date).format('dddd, MMMM D');
  };

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
          </div>
          <div className={styles.customCalendarWrapper}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500 }}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              views={['month', 'week', 'day']}
            />
          </div>
        </div>
        
        <div className={styles.upcomingEventsSection}>
          <div className={styles.sectionHeader}>
            <h2>Upcoming Events</h2>
          </div>
          {upcomingEvents.length === 0 ? (
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
                    {formatEventTime(event.start)} - {formatEventTime(event.end)}
                  </div>
                  <h3 className={styles.eventTitle}>{event.title}</h3>
                  <div className={styles.eventLocation}>
                    <span className={styles.locationIcon}>📍</span> {event.location}
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
                {formatEventDate(selectedEvent.start)}, {formatEventTime(selectedEvent.start)} - {formatEventTime(selectedEvent.end)}
              </div>
            </div>
            <div className={styles.detailsSection}>
              <div className={styles.detailsLabel}>Location:</div>
              <div className={styles.detailsContent}>{selectedEvent.location}</div>
            </div>
            <div className={styles.detailsSection}>
              <div className={styles.detailsLabel}>Description:</div>
              <div className={styles.detailsContent}>{selectedEvent.description}</div>
            </div>
            <div className={styles.detailsSection}>
              <div className={styles.detailsLabel}>Participants:</div>
              <div className={styles.detailsContent}>
                {selectedEvent.participants.join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}