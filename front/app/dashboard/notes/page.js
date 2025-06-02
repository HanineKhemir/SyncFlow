'use client'

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/app/hooks/useAuth';
import styles from './notes.module.css';

const CollaborativeNotes = () => {
    const { token, user } = useAuth();
    const [noteId, setNoteId] = useState(null);
    const [noteLines, setNoteLines] = useState([]);
    const [softLocks, setSoftLocks] = useState(new Map());
    const [currentLock, setCurrentLock] = useState(null);
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState('');
    const textareaRefs = useRef({});

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
                console.log('Fetch response:', res);
                if (!res.ok) {
                    throw new Error(`Error fetching noteId: ${res.status} ${res.statusText}`);
                }
                console.log('Response status:', res);
                const data = await res.json();
                console.log('Received noteId:', data.id);
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

                console.log('Fetched NoteLines:', json.data.NoteLines);
                setNoteLines(json.data.NoteLines || []);
            } catch (err) {
                console.error('Error fetching note lines:', err);
                setError('Error fetching note lines');
            }
        };

        fetchNoteLines();
    }, [noteId, token]);



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
            console.log('Received newPageCreated:', data);

            const isSameNote = data.noteId == noteId;
            if (!isSameNote) return;

            const linesArray =
                Array.isArray(data.newLines?.newLines) ? data.newLines.newLines : [];

            if (linesArray.length === 0) {
                console.log('No lines to add');
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

            console.log('New lines being added:', preparedLines);

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

    // Lock, edit, save handlers and UI rendering here — unchanged, same as your original code

    const handleLineFocus = (lineNumber) => {
        if (!socket || !isConnected) return;
        if (currentLock && currentLock.lineNumber === lineNumber) return;

        socket.emit('softlock', {
            noteId: noteId,
            lineNumber: lineNumber
        });

        setCurrentLock({ noteId, lineNumber });
    };

    const handleLineBlur = (lineNumber) => {
        if (!socket || !isConnected) return;

        if (currentLock && currentLock.lineNumber === lineNumber) {
            socket.emit('softunlock', {
                noteId: noteId,
                lineNumber: lineNumber
            });
            setCurrentLock(null);
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
    };

    const handleContentSave = (lineNumber, content, additionalData = {}, onSuccess) => {
        if (!socket || !isConnected) return;

        const updateData = {
            noteId: noteId,
            lineNumber: lineNumber,
            content: content,
            ...additionalData
        };

        socket.emit('alterNote', updateData, (response) => {
            if (response.success && onSuccess) {
                onSuccess();
            }
        });
    };

    const handleStyleChange = (lineNumber, styleProperty, value) => {
        console.log(`Changing style for line ${lineNumber}: ${styleProperty} = ${value}`);
        const line = noteLines.find(l => l.lineNumber === lineNumber);
        if (line) {
            const updateData = {
                noteId: noteId,
                lineNumber: lineNumber,
                content: line.content,
                [styleProperty]: value
            };
            console.log('Emitting alterNote with data:', updateData);

            setNoteLines(prev =>
                prev.map(l =>
                    l.lineNumber === lineNumber
                        ? { ...l, [styleProperty]: value }
                        : l
                )
            );
            console.log('Updated noteLines state:', noteLines);

            socket.emit('alterNote', updateData);
        }
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

                    return (
                        <div
                            key={line.id}
                            className={`${styles.noteLine} ${lockStatus.isLocked && !lockStatus.isLockedByMe ? styles.lockedLine : ''
                                } ${lockStatus.isLockedByMe ? styles.myLockedLine : ''
                                } ${isHighlighted ? styles.highlighted : ''
                                }`}
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
                                    onFocus={() => handleLineFocus(line.lineNumber)}
                                    onBlur={() => {
                                        handleContentSave(line.lineNumber, line.content, {}, () => {
                                            handleLineBlur(line.lineNumber);
                                        });
                                    }}
                                    onChange={(e) => handleContentChange(line.lineNumber, e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.ctrlKey) {
                                            e.target.blur();
                                        }
                                    }}
                                />

                                {lockStatus.isLocked && (
                                    <div className={styles.lockIndicator}>
                                        {lockStatus.isLockedByMe
                                            ? 'Editing...'
                                            : `Locked by ${lockStatus.lockedBy}`}
                                    </div>
                                )}
                            </div>

                            <div className={styles.controls}>
                                <div className={styles.controlGroup}>
                                    <label>Size:</label>
                                    <input
                                        type="number"
                                        min="8"
                                        max="72"
                                        value={line.fontSize}
                                        onChange={(e) => handleStyleChange(line.lineNumber, 'fontSize', parseInt(e.target.value))}
                                        className={styles.smallInput}
                                        disabled={!lockStatus.canEdit}
                                    />
                                </div>

                                <div className={styles.controlGroup}>
                                    <label>Color:</label>
                                    <input
                                        type="color"
                                        value={line.color || '#ffffff'}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={e =>
                                            handleStyleChange(line.lineNumber, 'color', e.target.value)
                                        }
                                    />

                                </div>

                                <div className={styles.controlGroup}>
                                    <input
                                        type="checkbox"
                                        checked={line.highlighted}
                                        onChange={(e) => handleStyleChange(line.lineNumber, 'highlighted', e.target.checked)}
                                        className={styles.checkbox}
                                        disabled={!lockStatus.canEdit}
                                    />
                                    <label>Highlight</label>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.tips}>
                <p>Tips:</p>
                <ul>
                    <li>Click on a line to start editing (soft lock)</li>
                    <li>Press Ctrl+Enter to save and move to next line</li>
                    <li>Lines automatically extend when you approach the end</li>
                    <li>Red border = locked by another user</li>
                    <li>Green border = locked by you</li>
                </ul>
            </div>
        </div>
    );
};

export default CollaborativeNotes;
