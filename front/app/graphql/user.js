// graphql/users.js
import { gql } from '@apollo/client';

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      username
      role
      company {
        id
        name
      }
      deletedAt
    }
  }
`;

export const GET_USERS_BY_COMPANY = gql`
  query GetUsersByCompany($companyId: ID!) {
    usersByCompany(companyId: $companyId) {
      id
      username
      role
      deletedAt
      company {
        id
        name
      }
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      username
      role
      company {
        id
        name
      }
      deletedAt
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      username
      role
      company {
        id
        name
      }
    }
  }
`;

export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

export const RECOVER_USER_MUTATION = gql`
  mutation RecoverUser($id: ID!) {
    recoverUser(id: $id) {
      id
      username
      role
      company {
        id
        name
      }
    }
  }
`;

export const GET_DELETED_USERS = gql`
  query GetDeletedUsers {
    deletedUsers {
      id
      username
      role
      company {
        id
        name
      }
      deletedAt
    }
  }
`;