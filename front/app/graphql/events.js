import { gql } from '@apollo/client';

// Query to get all events
export const GET_ALL_EVENTS = gql`
  query GetAllEvents {
    getAllEvents {
      id
      title
      description
      date
      createdBy {
        id
        username
      }
    }
  }
`;

// Query to get events by month
export const GET_EVENTS_BY_MONTH = gql`
  query EventByMonth($date: String!) {
    EventByMonth(date: $date) {
      id
      title
      description
      date
      createdBy {
        id
        username
      }
    }
  }
`;

// Query to get events by day
export const GET_EVENTS_BY_DAY = gql`
  query EventByDay($date: Date!) {
    EventByDay(date: $date) {
      id
      title
      description
      date
      createdBy {
        id
        username
      }
    }
  }
`;