'use client'
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/app/hooks/useAuth';
import styles from './notes.module.css';

const CollaborativeNotes = ({ noteId = 1 }) => {
    const { token, user } = useAuth();
    const [noteLines, setNoteLines] = useState([]);
    const [softLocks, setSoftLocks] = useState(new Map());
    const [currentLock, setCurrentLock] = useState(null);
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState('');
    const textareaRefs = useRef({});

    // Initialize socket connection
    useEffect(() => {
        if (!token || !user) return;

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
            console.log('Received current locks:', locks);
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

        newSocket.on('error', (errorData) => {
            setError(errorData.message);
            setTimeout(() => setError(''), 3000);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [token, user, noteId]);

    // Initialize with empty lines
    useEffect(() => {
        const emptyLines = Array.from({ length: 20 }, (_, index) => ({
            id: `line-${index + 1}`,
            lineNumber: index + 1,
            content: '',
            color: '#000000',
            fontSize: 16,
            highlighted: false,
            updatedAt: new Date().toISOString()
        }));
        setNoteLines(emptyLines);
    }, [noteId]);

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
      onSuccess(); // Unlock only after successful save
    }
  });
};

    const handleStyleChange = (lineNumber, styleProperty, value) => {
        const line = noteLines.find(l => l.lineNumber === lineNumber);
        if (line) {
            const updateData = {
                noteId: noteId,
                lineNumber: lineNumber,
                content: line.content,
                [styleProperty]: value
            };

            setNoteLines(prev =>
                prev.map(l =>
                    l.lineNumber === lineNumber
                        ? { ...l, [styleProperty]: value }
                        : l
                )
            );

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

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Collaborative Note #{noteId}</h2>
                <div className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected
                    }`}>
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
                                        // Save first, then unlock
                                        handleContentSave(line.lineNumber, line.content, {}, () => {
                                            // This callback runs after successful save
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
                                        value={line.color}
                                        onChange={(e) => handleStyleChange(line.lineNumber, 'color', e.target.value)}
                                        className={styles.colorInput}
                                        disabled={!lockStatus.canEdit}
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