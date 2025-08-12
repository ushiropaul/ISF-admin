

// src/pages/boletines.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export default function Boletines() {
  const [notas, setNotas] = useState([]);
  const [faltas, setFaltas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [alumnos, setAlumnos] = useState([]);

  useEffect(() => {
    fetchData();

    // Escuchar cambios en tiempo real
    const notasSub = supabase
      .channel('public:notas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notas' }, fetchData)
      .subscribe();

    const asistenciasSub = supabase
      .channel('public:asistencias')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asistencias' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(notasSub);
      supabase.removeChannel(asistenciasSub);
    };
  }, []);

  const fetchData = async () => {
    const { data: notasData } = await supabase.from('notas').select('*');
    const { data: faltasData } = await supabase.from('asistencias').select('*');
    const { data: materiasData } = await supabase.from('materias').select('*');
    const { data: alumnosData } = await supabase.from('alumnos').select('*');

    setNotas(notasData || []);
    setFaltas(faltasData || []);
    setMaterias(materiasData || []);
    setAlumnos(alumnosData || []);
  };

  const calcularPromedios = (alumnoId) => {
    const notasAlumno = notas.filter(n => n.alumno_id === alumnoId);
    if (!notasAlumno.length) return { porMateria: {}, general: 0 };

    const porMateria = {};
    materias.forEach(m => {
      const notasMateria = notasAlumno.filter(n => n.materia_id === m.id);
      if (notasMateria.length) {
        const promedio = notasMateria.reduce((acc, n) => acc + n.nota, 0) / notasMateria.length;
        porMateria[m.nombre] = promedio.toFixed(2);
      }
    });

    const promedioGeneral = (notasAlumno.reduce((acc, n) => acc + n.nota, 0) / notasAlumno.length).toFixed(2);

    return { porMateria, general: promedioGeneral };
  };

  const generarPDF = (alumno) => {
    const doc = new jsPDF();
    const promedios = calcularPromedios(alumno.id);
    const faltasAlumno = faltas.filter(f => f.alumno_id === alumno.id && f.tipo === 'falta').length;
    const tardesAlumno = faltas.filter(f => f.alumno_id === alumno.id && f.tipo === 'tarde').length;

    doc.text(`Boletín - ${alumno.nombre} ${alumno.apellido}`, 10, 10);
    doc.text(`Curso: ${alumno.curso}`, 10, 20);
    doc.text(`Promedio general: ${promedios.general}`, 10, 30);

    let y = 40;
    for (const materia in promedios.porMateria) {
      doc.text(`${materia}: ${promedios.porMateria[materia]}`, 10, y);
      y += 10;
    }

    doc.text(`Faltas: ${faltasAlumno}`, 10, y + 10);
    doc.text(`Llegadas tarde: ${tardesAlumno}`, 10, y + 20);

    doc.save(`boletin_${alumno.nombre}_${alumno.apellido}.pdf`);
  };

  const generarWord = (alumno) => {
    const promedios = calcularPromedios(alumno.id);
    const faltasAlumno = faltas.filter(f => f.alumno_id === alumno.id && f.tipo === 'falta').length;
    const tardesAlumno = faltas.filter(f => f.alumno_id === alumno.id && f.tipo === 'tarde').length;

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: `Boletín - ${alumno.nombre} ${alumno.apellido}`, bold: true, size: 28 })] }),
          new Paragraph(`Curso: ${alumno.curso}`),
          new Paragraph(`Promedio general: ${promedios.general}`),
          ...Object.entries(promedios.porMateria).map(([materia, promedio]) =>
            new Paragraph(`${materia}: ${promedio}`)
          ),
          new Paragraph(`Faltas: ${faltasAlumno}`),
          new Paragraph(`Llegadas tarde: ${tardesAlumno}`)
        ]
      }]
    });

    Packer.toBlob(doc).then(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `boletin_${alumno.nombre}_${alumno.apellido}.docx`;
      link.click();
    });
  };

  const generarBoletinesCurso = (curso) => {
    alumnos.filter(a => a.curso === curso).forEach(generarPDF);
  };

  const generarBoletinesTodos = () => {
    alumnos.forEach(generarPDF);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Generar Boletines</h1>

      <button onClick={generarBoletinesTodos} className="bg-green-500 text-white px-4 py-2 rounded mr-2">
        Boletines de Todos
      </button>

      {[...new Set(alumnos.map(a => a.curso))].map(curso => (
        <button key={curso} onClick={() => generarBoletinesCurso(curso)} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
          Boletines Curso {curso}
        </button>
      ))}

      <table className="w-full border mt-6">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Alumno</th>
            <th className="p-2 border">Curso</th>
            <th className="p-2 border">Promedio General</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {alumnos.map(alumno => {
            const promedios = calcularPromedios(alumno.id);
            return (
              <tr key={alumno.id}>
                <td className="p-2 border">{alumno.nombre} {alumno.apellido}</td>
                <td className="p-2 border">{alumno.curso}</td>
                <td className="p-2 border">{promedios.general}</td>
                <td className="p-2 border">
                  <button onClick={() => generarPDF(alumno)} className="bg-red-500 text-white px-3 py-1 rounded mr-2">
                    PDF
                  </button>
                  <button onClick={() => generarWord(alumno)} className="bg-yellow-500 text-black px-3 py-1 rounded">
                    Word
                  </button>
                </td>
              </tr>
            );
          })}
          {alumnos.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center p-3">No hay alumnos registrados</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
