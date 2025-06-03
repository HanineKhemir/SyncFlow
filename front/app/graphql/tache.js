import { gql } from '@apollo/client';
// In your tache.js (or wherever GET_TASKS_BY_COMPANY is defined)

export const GET_TASKS_BY_COMPANY = gql`
  query GetTasksByCompany($companyId: ID!) {
    tasksByCompany(companyId: $companyId) {
      id
      title
      description
      
      createdAt
      dueDate
      completed
      assignedTo {
        id
        username
      }
    }
  }
`;
     
  