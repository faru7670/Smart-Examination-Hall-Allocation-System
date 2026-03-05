import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Instance, Instances, Html } from '@react-three/drei';
import * as THREE from 'three';

const SUBJECT_COLORS = {
    '#818cf8': '#818cf8',
    '#f472b6': '#f472b6',
    '#fbbf24': '#fbbf24',
    '#34d399': '#34d399',
    '#f87171': '#f87171',
    '#22d3ee': '#22d3ee',
    '#a78bfa': '#a78bfa',
    '#fb923c': '#fb923c',
    '#2dd4bf': '#2dd4bf',
    '#fb7185': '#fb7185',
};

const Seat = ({ position, data, isSelected, onClick, colorMap }) => {
    const defaultColor = '#e2e8f0'; // slate-200
    const highlightColor = '#38bdf8'; // sky-400

    let seatColor = defaultColor;
    if (!data.empty && data.subject_code && colorMap[data.subject_code]) {
        seatColor = colorMap[data.subject_code].hex;
    }

    const scale = isSelected ? 1.2 : 1;
    const yPos = isSelected ? position[1] + 0.5 : position[1];

    return (
        <group position={[position[0], yPos, position[2]]} scale={scale} onClick={(e) => { e.stopPropagation(); onClick(data); }}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[0.8, 0.4, 0.8]} />
                <meshStandardMaterial color={isSelected ? highlightColor : seatColor} roughness={0.6} metalness={0.2} />
            </mesh>
            {/* Table Top */}
            <mesh position={[0, 0.25, 0]} castShadow>
                <boxGeometry args={[0.9, 0.05, 0.9]} />
                <meshStandardMaterial color={isSelected ? '#7dd3fc' : '#cbd5e1'} roughness={0.4} />
            </mesh>

            {/* Display text above if it's occupied or selected */}
            {!data.empty && (
                <Text
                    position={[0, 0.8, 0]}
                    fontSize={0.2}
                    color="#000000"
                    anchorX="center"
                    anchorY="middle"
                    rotation={[-Math.PI / 4, 0, 0]}
                >
                    {data.student_id}
                </Text>
            )}
        </group>
    );
};

export default function ThreeDHall({ hall, gridData, subjectMap = {}, onSeatClick, height = "500px" }) {
    const [selectedSeat, setSelectedSeat] = useState(null);

    if (!hall || !gridData) return null;

    const rows = hall.rows;
    const cols = hall.cols;

    // Center the grid around origin
    const offsetX = -(cols * 1.5) / 2 + 0.75;
    const offsetZ = -(rows * 1.5) / 2 + 0.75;

    const handleSeatClick = (seat) => {
        setSelectedSeat(seat);
        if (onSeatClick) onSeatClick(seat);
    };

    return (
        <div style={{ height, width: '100%', borderRadius: '1rem', overflow: 'hidden', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <Canvas shadows camera={{ position: [0, Math.max(rows, cols) * 1.5, Math.max(rows, cols) * 1.5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <directionalLight
                    castShadow
                    position={[10, 20, 10]}
                    intensity={1.5}
                    shadow-mapSize={[1024, 1024]}
                />

                {/* Floor */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
                    <planeGeometry args={[cols * 2 + 5, rows * 2 + 5]} />
                    <meshStandardMaterial color="#f8fafc" />
                </mesh>

                {/* Grid of Seats */}
                <group position={[0, 0, 0]}>
                    {gridData.map((row, rIdx) => (
                        row.map((seat, cIdx) => (
                            <Seat
                                key={`${rIdx}-${cIdx}`}
                                position={[cIdx * 1.5 + offsetX, 0, rIdx * 1.5 + offsetZ]}
                                data={seat}
                                isSelected={selectedSeat && selectedSeat.row_num === seat.row_num && selectedSeat.col_num === seat.col_num}
                                onClick={handleSeatClick}
                                colorMap={subjectMap}
                            />
                        ))
                    ))}
                </group>

                <OrbitControls
                    makeDefault
                    minPolarAngle={Math.PI / 6}
                    maxPolarAngle={Math.PI / 2 - 0.1}
                    minDistance={5}
                    maxDistance={50}
                    target={[0, 0, 0]}
                />
            </Canvas>
        </div>
    );
}
