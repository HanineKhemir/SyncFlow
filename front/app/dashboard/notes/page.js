'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/app/hooks/useAuth';
import styles from './notes.module.css';

// Debounce utility to limit how often a function is called
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const CollaborativeNotes = () => {
    const { token, user } = useAuth();
    const [noteId, setNoteId] = useState(null);
    const [noteLines, setNoteLines] = useState([]);
    const [softLocks, setSoftLocks] = useState(new Map());
    const [currentLock, setCurrentLock] = useState(null);
    const [selectedLine, setSelectedLine] = useState(null);
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState('');
    const textareaRefs = useRef({});
    const styleMenuRef = useRef(null);
    const pendingSaves = useRef({}); // Track pending save promises

    // Get the currently selected line data for the style menu
    const getSelectedLineData = () => {
        if (!selectedLine) return null;
        return noteLines.find(line => line.lineNumber === selectedLine);
    };

    const selectedLineData = getSelectedLineData();

    // Debounced save function
    const debouncedSave = useCallback(
        debounce((lineNumber, content, additionalData = {}, onSuccess) => {
            if (!socket || !isConnected) return;

            const updateData = {
                noteId: noteId,
                lineNumber: lineNumber,
                content: content,
                ...additionalData
            };

            const savePromise = new Promise((resolve) => {
                socket.emit('alterNote', updateData, (response) => {
                    if (response.success && onSuccess) {
                        onSuccess();
                    }
                    resolve();
                });
            });

            pendingSaves.current[lineNumber] = savePromise;
        }, 500),
        [socket, isConnected, noteId]
    );

    // Fetch noteId first
    useEffect(() => {
        if (!token) return;

        const fetchNoteId = async () => {
            try {
                console.log('Fetching noteId for user:', user?.username);
                const res = await fetch('http://localhost:3000/note', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!res.ok) {
                    throw new Error(`Error fetching noteId: ${res.status} ${res.statusText}`);
                }
                const data = await res.json();
                setNoteId(data.id);
            } catch (err) {
                console.error('Error fetching noteId:', err);
            }
        };

        fetchNoteId();
    }, [token, user]);

    // Fetch note lines when noteId changes
    useEffect(() => {
        if (!noteId || !token) return;

        const fetchNoteLines = async () => {
            try {
                const res = await fetch('http://localhost:3000/graphql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        query: `
              query GetNoteLines($noteId: ID!, $start: Int!, $limit: Int!) {
                NoteLines(noteId: $noteId, start: $start, limit: $limit) {
                  id
                  lineNumber
                  content
                  color
                  fontSize
                  highlighted
                  lastEditedBy {
                    id
                    username
                  }
                }
              }
            `,
                        variables: {
                            noteId,
                            start: 0,
                            limit: 100,
                        },
                    }),
                });

                if (!res.ok) {
                    throw new Error(`GraphQL query failed: ${res.status} ${res.statusText}`);
                }

                const json = await res.json();

                if (json.errors) {
                    console.error('GraphQL errors:', json.errors);
                    setError('Failed to load note lines');
                    return;
                }

                setNoteLines(json.data.NoteLines || []);
            } catch (err) {
                console.error('Error fetching note lines:', err);
                setError('Error fetching note lines');
            }
        };

        fetchNoteLines();
    }, [noteId, token]);

    // Handle global click events for unlocking
    useEffect(() => {
        const handleClickOutside = async (event) => {
            if (!currentLock || !socket || !isConnected) return;

            const isStyleMenuClick = styleMenuRef.current && styleMenuRef.current.contains(event.target);
            const isTextareaClick = Object.values(textareaRefs.current).some(ref => ref && ref.contains(event.target));

            if (!isStyleMenuClick && !isTextareaClick) {
                // Wait for any pending save to complete
                if (pendingSaves.current[currentLock.lineNumber]) {
                    await pendingSaves.current[currentLock.lineNumber];
                    delete pendingSaves.current[currentLock.lineNumber];
                }

                socket.emit('softunlock', {
                    noteId: noteId,
                    lineNumber: currentLock.lineNumber
                });
                setCurrentLock(null);
                setSelectedLine(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [currentLock, socket, isConnected, noteId]);

    useEffect(() => {
        if (!token || !user || !noteId) return;

        const newSocket = io('ws://localhost:3000/whiteboard', {
            query: {
                Authorization: token
            }
        });

        newSocket.on('connect', () => {
            console.log('Connected to WebSocket');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from WebSocket');
            setIsConnected(false);
        });

        newSocket.on('currentSoftlocks', (locks) => {
            const lockMap = new Map();
            locks.forEach(lock => {
                if (lock.noteId === noteId) {
                    lockMap.set(lock.lineNumber, lock.username);
                }
            });
            setSoftLocks(lockMap);
        });

        newSocket.on('softlock', (data) => {
            if (data.noteId === noteId) {
                setSoftLocks(prev => new Map(prev.set(data.lineNumber, data.username)));
            }
        });

        newSocket.on('softunlock', (data) => {
            if (data.noteId === noteId) {
                setSoftLocks(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(data.lineNumber);
                    return newMap;
                });

                if (data.username === user.username) {
                    setCurrentLock(null);
                }
            }
        });

        newSocket.on('noteUpdated', (updatedLine) => {
            if (updatedLine.noteId === noteId) {
                setNoteLines(prev => {
                    const existingLineIndex = prev.findIndex(line => line.lineNumber === updatedLine.lineNumber);
                    if (existingLineIndex !== -1) {
                        return prev.map(line =>
                            line.lineNumber === updatedLine.lineNumber
                                ? { ...line, ...updatedLine }
                                : line
                        );
                    } else {
                        return [...prev, updatedLine].sort((a, b) => a.lineNumber - b.lineNumber);
                    }
                });
            }
        });

        newSocket.on('newPageCreated', (data) => {
            const isSameNote = data.noteId == noteId;
            if (!isSameNote) return;

            const linesArray =
                Array.isArray(data.newLines?.newLines) ? data.newLines.newLines : [];

            if (linesArray.length === 0) {
                return;
            }

            const preparedLines = linesArray.map(line => ({
                id: line.id,
                lineNumber: line.lineNumber,
                content: line.content ?? '',
                fontSize: line.fontsize ?? 14,
                color: line.color ?? '#000000',
                highlighted: line.highlighted ?? false,
            }));

            setNoteLines(prev =>
                [...prev, ...preparedLines].sort((a, b) => a.lineNumber - b.lineNumber)
            );
        });

        newSocket.on('error', (errorData) => {
            setError(errorData.message);
            setTimeout(() => setError(''), 3000);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [token, user, noteId]);

    const handleLineFocus = (lineNumber) => {
        if (!socket || !isConnected) return;
        if (currentLock && currentLock.lineNumber === lineNumber) return;
        
        setSelectedLine(lineNumber);
        
        socket.emit('softlock', {
            noteId: noteId,
            lineNumber: lineNumber
        });

        setCurrentLock({ noteId, lineNumber });

        // Focus the textarea
        const textarea = textareaRefs.current[lineNumber];
        if (textarea) {
            textarea.focus();
        }
    };

    const handleContentChange = (lineNumber, newContent) => {
        setNoteLines(prev =>
            prev.map(line =>
                line.lineNumber === lineNumber
                    ? { ...line, content: newContent }
                    : line
            )
        );

        // Trigger debounced save
        debouncedSave(lineNumber, newContent);
    };

    const handleStyleChange = (styleProperty, value) => {
        if (!selectedLine || !selectedLineData) return;
        
        const updateData = {
            noteId: noteId,
            lineNumber: selectedLine,
            content: selectedLineData.content,
            [styleProperty]: value
        };

        setNoteLines(prev =>
            prev.map(l =>
                l.lineNumber === selectedLine
                    ? { ...l, [styleProperty]: value }
                    : l
            )
        );

        socket.emit('alterNote', updateData);
    };

    const getLineLockStatus = (lineNumber) => {
        const lockedBy = softLocks.get(lineNumber);
        return {
            isLocked: !!lockedBy,
            lockedBy: lockedBy,
            isLockedByMe: lockedBy === user?.username,
            canEdit: !lockedBy || lockedBy === user?.username
        };
    };

    if (!user) {
        return <div className={styles.container}>Please log in to access notes.</div>;
    }

    if (!noteId) {
        return <div className={styles.container}>Loading note...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Collaborative Note #{noteId}</h2>
                <div className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </div>
                <div ref={styleMenuRef} className={`${styles.styleMenu} ${!selectedLineData ? styles.disabled : ''}`}>
                    <div className={styles.menuLabel}>
                        {selectedLineData 
                            ? `Editing Line ${selectedLine}` 
                            : 'Select a line to edit styling'
                        }
                    </div>

                    <div className={styles.menuControl}>
                        <label>Size</label>
                        <input
                            type="number"
                            min="8"
                            max="72"
                            value={selectedLineData?.fontSize || 14}
                            onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value))}
                            className={styles.menuInput}
                            disabled={!selectedLineData}
                            style={{ width: '70px' }}
                        />
                    </div>

                    <div className={styles.menuControl}>
                        <label>Color</label>
                        <input
                            type="color"
                            value={selectedLineData?.color || '#000000'}
                            onChange={(e) => handleStyleChange('color', e.target.value)}
                            className={styles.colorInput}
                            disabled={!selectedLineData}
                        />
                    </div>

                    <div 
                        className={`${styles.highlightToggle} ${selectedLineData?.highlighted ? styles.active : ''}`}
                        onClick={() => selectedLineData && handleStyleChange('highlighted', !selectedLineData.highlighted)}
                    >
                        <input
                            type="checkbox"
                            checked={selectedLineData?.highlighted || false}
                            onChange={() => {}}
                            className={styles.checkbox}
                            disabled={!selectedLineData}
                        />
                        <span>Highlight</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            <div className={styles.noteLines}>
                {noteLines.map((line) => {
                    const lockStatus = getLineLockStatus(line.lineNumber);
                    const isHighlighted = line.highlighted;
                    const isSelected = selectedLine === line.lineNumber;

                    return (
                        <div
                            key={line.id}
                            className={`${styles.noteLine} 
                                ${lockStatus.isLocked && !lockStatus.isLockedByMe ? styles.lockedLine : ''} 
                                ${isSelected ? styles.selected : ''} 
                                ${isHighlighted ? styles.highlighted : ''}
                            `}
                            onClick={() => !lockStatus.isLocked && handleLineFocus(line.lineNumber)}
                        >
                            <div className={styles.lineNumber}>
                                {line.lineNumber}
                            </div>

                            <div className={styles.lineContent}>
                                <textarea
                                    ref={el => textareaRefs.current[line.lineNumber] = el}
                                    style={{
                                        fontSize: `${line.fontSize}px`,
                                        color: line.color
                                    }}
                                    className={styles.textarea}
                                    value={line.content || ''}
                                    disabled={!lockStatus.canEdit}
                                    placeholder={lockStatus.isLocked && !lockStatus.isLockedByMe
                                        ? `Locked by ${lockStatus.lockedBy}`
                                        : 'Enter text...'}
                                    onChange={(e) => handleContentChange(line.lineNumber, e.target.value)}
                                />

                                {lockStatus.isLocked && (
                                    <div className={styles.lockIndicator}>
                                        {lockStatus.isLockedByMe
                                            ? 'Editing...'
                                            : `Locked by ${lockStatus.lockedBy}`}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.tips}>
                <p>Tips:</p>
                <ul>
                    <li>Click anywhere on a line to edit it</li>
                    <li>Use the style menu to change size, color, and highlighting</li>
                    <li>Changes are saved automatically after a brief pause</li>
                    <li>Click outside the current line and style menu to unlock</li>
                    <li>Red background = locked by another user</li>
                    <li>Green background = currently selected by you</li>
                </ul>
            </div>
        </div>
    );
};

export default CollaborativeNotes;  