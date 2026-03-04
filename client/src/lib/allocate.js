function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function allocateSeats(students, halls) {
    const subjectGroups = {};
    for (const s of students) {
        if (!subjectGroups[s.subject_code]) subjectGroups[s.subject_code] = [];
        subjectGroups[s.subject_code].push(s);
    }

    const subjects = Object.keys(subjectGroups);
    for (const subj of subjects) subjectGroups[subj] = shuffle(subjectGroups[subj]);

    // Round-robin interleave — ensures subjects are spread across seats
    const spread = [];
    const queues = subjects.map(s => [...subjectGroups[s]]);
    let active = queues.filter(q => q.length > 0);
    while (active.length > 0) {
        for (const q of active) { if (q.length > 0) spread.push(q.shift()); }
        active = queues.filter(q => q.length > 0);
    }

    const allocations = [];
    const unallocated = [];
    let idx = 0;
    const sortedHalls = [...halls].sort((a, b) => b.capacity - a.capacity);

    for (const hall of sortedHalls) {
        if (idx >= spread.length) break;
        const grid = [];
        for (let r = 0; r < hall.rows; r++) {
            const row = [];
            for (let c = 0; c < hall.cols; c++) {
                if (idx < spread.length) {
                    const s = spread[idx++];
                    row.push({ student_id: s.student_id, student_name: s.name, subject_code: s.subject_code, hall_id: hall.id, hall_name: hall.name, row_num: r + 1, col_num: c + 1 });
                } else { row.push(null); }
            }
            grid.push(row);
        }

        // Conflict resolution — no two same subjects sit adjacent horizontally
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length - 1; c++) {
                const cur = grid[r][c], nxt = grid[r][c + 1];
                if (cur && nxt && cur.subject_code === nxt.subject_code) {
                    let swapped = false;
                    for (let sr = 0; sr < grid.length && !swapped; sr++) {
                        for (let sc = 0; sc < grid[sr].length && !swapped; sc++) {
                            if (sr === r && sc === c + 1) continue;
                            const cand = grid[sr][sc];
                            if (!cand || cand.subject_code === cur.subject_code) continue;
                            const l = c > 0 ? grid[r][c - 1] : null, rr = c + 2 < grid[r].length ? grid[r][c + 2] : null;
                            if (l && l.subject_code === cand.subject_code) continue;
                            if (rr && rr.subject_code === cand.subject_code) continue;
                            const cl = sc > 0 ? grid[sr][sc - 1] : null, cr = sc + 1 < grid[sr].length ? grid[sr][sc + 1] : null;
                            if (cl && cl.subject_code === nxt.subject_code) continue;
                            if (cr && cr.subject_code === nxt.subject_code) continue;
                            grid[r][c + 1] = cand; grid[sr][sc] = nxt;
                            grid[r][c + 1].row_num = r + 1; grid[r][c + 1].col_num = c + 2;
                            grid[sr][sc].row_num = sr + 1; grid[sr][sc].col_num = sc + 1;
                            swapped = true;
                        }
                    }
                }
            }
        }

        for (const row of grid) for (const seat of row) if (seat) allocations.push(seat);
    }

    while (idx < spread.length) unallocated.push(spread[idx++]);
    return { allocations, unallocated };
}
