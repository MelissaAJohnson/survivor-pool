import React, { useEffect, useState } from "react";

function getWeekDeadline(week) {
    const baseDeadline = new Date(Date.UTC(2025, 5, 8, 18, 0));
    const deadline = new Date(baseDeadline.getTime() + (week-1) * 7 * 24 * 60 * 60 * 1000);
    return deadline;
}

function formatTimeRemaining(ms) {
    if (ms <= 0) return "Locked";
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;  
}

export default function CountdownTime({ week }) {
    const [timeRemaining, setTimeRemaining] = useState(() => {
        const deadline = getWeekDeadline(week);
        return deadline - new Date();
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const deadline = getWeekDeadline(week);
            setTimeRemaining(deadline - new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, [week]);

    return (
        <span style={{ fontFamily: "monospace", fontSize: "1rem" }}>
            {formatTimeRemaining(timeRemaining)}
        </span>
    );
}