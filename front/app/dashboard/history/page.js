'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { GET_TASKS_BY_COMPANY } from '@/app/graphql/tache';
export default function History(){ 
  const {token,user,isManager}=useAuth('')
  const { data, loading, error, refetch } = useQuery(GET_TASKS_BY_COMPANY, {
      variables: { userId: user?.id?.toString() },
      skip: !user?.id, // Skip query if user is not available
      context: {
        headers: {
          authorization: token ? `Bearer ${token}` : "",
        },
      },
    });


  
}