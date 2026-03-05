export function allocateSeats(students, halls) {
    if (!students || students.length === 0 || !halls || halls.length === 0) {
        return { allocations: [], unallocated: students || [], conflicts: 0 }
    }

    const allocations = []
    const sortedHalls = [...halls].sort((a, b) => b.capacity - a.capacity)

    // Group students by subject
    const subjectGroups = {}
    students.forEach(s => {
        if (!subjectGroups[s.subject_code]) subjectGroups[s.subject_code] = []
        subjectGroups[s.subject_code].push(s)
    })

    // Create a round-robin queue interleaving subjects
    const allQueue = []
    let hasMore = true
    while (hasMore) {
        hasMore = false
        for (const subj in subjectGroups) {
            if (subjectGroups[subj].length > 0) {
                allQueue.push(subjectGroups[subj].shift())
                hasMore = true
            }
        }
    }

    let qIdx = 0
    let conflicts = 0

    // Fill halls
    for (const hall of sortedHalls) {
        if (qIdx >= allQueue.length) break

        // We build a 2D matrix for the hall to check neighbors easily
        const grid = Array(hall.rows).fill(null).map(() => Array(hall.cols).fill(null))

        for (let r = 0; r < hall.rows; r++) {
            for (let c = 0; c < hall.cols; c++) {
                if (qIdx >= allQueue.length) break
                grid[r][c] = allQueue[qIdx]
                qIdx++
            }
        }

        // Optimization Pass: Resolve Adjacency Conflicts (Left, Right, Top, Bottom)
        for (let r = 0; r < hall.rows; r++) {
            for (let c = 0; c < hall.cols; c++) {
                const me = grid[r][c]
                if (!me) continue

                // Check left neighbor
                const left = c > 0 ? grid[r][c - 1] : null
                // Check top neighbor
                const top = r > 0 ? grid[r - 1][c] : null

                if ((left && left.subject_code === me.subject_code) ||
                    (top && top.subject_code === me.subject_code)) {

                    // We have a conflict. Search the grid for someone we can swap with who doesn't cause a new conflict.
                    let swapped = false
                    for (let sr = 0; sr < hall.rows; sr++) {
                        for (let sc = 0; sc < hall.cols; sc++) {
                            const candidate = grid[sr][sc]
                            if (candidate && candidate.subject_code !== me.subject_code) {
                                // Check if placing me at (sr, sc) is safe, and candidate at (r,c) is safe
                                const candidateSafeHere =
                                    (!left || left.subject_code !== candidate.subject_code) &&
                                    (!top || top.subject_code !== candidate.subject_code)

                                const meSafeThere =
                                    (sc === 0 || grid[sr][sc - 1]?.subject_code !== me.subject_code) &&
                                    (sr === 0 || grid[sr - 1][sc]?.subject_code !== me.subject_code)

                                if (candidateSafeHere && meSafeThere) {
                                    // SWAP
                                    grid[r][c] = candidate
                                    grid[sr][sc] = me
                                    swapped = true
                                    break
                                }
                            }
                        }
                        if (swapped) break
                    }
                    if (!swapped) conflicts++
                }
            }
        }

        // Flatten matrix back to allocations
        for (let r = 0; r < hall.rows; r++) {
            for (let c = 0; c < hall.cols; c++) {
                const s = grid[r][c]
                if (s) {
                    allocations.push({
                        student_id: s.student_id,
                        student_name: s.name,
                        subject_code: s.subject_code,
                        hall_id: hall.id,
                        hall_name: hall.name,
                        row_num: r + 1,
                        col_num: c + 1
                    })
                }
            }
        }
    }

    const unallocated = allQueue.slice(qIdx)
    return { allocations, unallocated, conflicts }
}
