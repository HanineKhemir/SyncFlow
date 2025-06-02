import { gql } from '@apollo/client';
export const GET_TASKS_BY_COMPANY = gql`
  query GetTasksByUser($companyId: ID!) {
    tasksByCompany(companyId: $companyId) {
      id
      title
      description
      dueDate
      completed
      assignedTo {
        id
        username
        }
     
    }
  }
`;