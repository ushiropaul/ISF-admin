

// src/pages/boletines.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient.js";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";

export default function Boletines() {
  const [notas, setNotas] = useState([]);
  const [faltas, setFaltas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [alumnos, setAlumnos] = useState([]);

  useEffect(() => {
    fetchData();

    const notasSub = supabase
      .channel("public:notas")
      .on("postgres_changes", { event: "*", schema: "public", table: "notas" }, fetchData)
      .subscribe();

    const asistenciasSub = supabase
      .channel("public:asistencias")
      .on("postgres_changes", { event: "*", schema: "public", table: "asistencias" }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(notasSub);
      supabase.removeChannel(asistenciasSub);
    };
  }, []);

  const fetchData = async () => {
    const { data: notasData } = await supabase.from("notas").select("*");
    const { data: faltasData } = await supabase.from("asistencias").select("*");
    const { data: materiasData } = await supabase.from("materias").select("*");

    const { data: alumnosData } = await supabase
      .from("alumnos")
      .select(`
        id,
        nombre,
        apellido,
        documento,
        fecha_nacimiento,
        grupo_sanguineo,
        nacionalidad,
        edad,
        num_cel,
        localidad,
        domicilio,
        curso_id,
        cursos(nombre)
      `);

    setNotas(notasData || []);
    setFaltas(faltasData || []);
    setMaterias(materiasData || []);
    setAlumnos(alumnosData || []);
  };

  const calcularPromedios = (alumnoId) => {
    const notasAlumno = notas.filter((n) => n.alumno_id === alumnoId);
    if (!notasAlumno.length) return { porMateria: {}, general: 0, porCuatrimestre: {}, porAnio: {} };

    const porMateria = {};
    const porCuatrimestre = {};
    const porAnio = {};

    materias.forEach((m) => {
      const notasMateria = notasAlumno.filter((n) => n.materia_id === m.id);
      if (notasMateria.length) {
        const promedio = notasMateria.reduce((acc, n) => acc + Number(n.nota || 0), 0) / notasMateria.length;
        porMateria[m.nombre] = promedio.toFixed(2);

        // Promedio por cuatrimestre
        notasMateria.forEach((n) => {
          const clave = `${m.nombre} - C${n.cuatrimestre}`;
          if (!porCuatrimestre[clave]) porCuatrimestre[clave] = [];
          porCuatrimestre[clave].push(Number(n.nota || 0));
        });

        // Promedio por año
        notasMateria.forEach((n) => {
          const clave = `${m.nombre} - ${n.anio}`;
          if (!porAnio[clave]) porAnio[clave] = [];
          porAnio[clave].push(Number(n.nota || 0));
        });
      }
    });

    // Calcular promedios finales por cuatrimestre y año
    for (const key in porCuatrimestre) {
      const arr = porCuatrimestre[key];
      porCuatrimestre[key] = (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
    }
    for (const key in porAnio) {
      const arr = porAnio[key];
      porAnio[key] = (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
    }

    const promedioGeneral = (
      notasAlumno.reduce((acc, n) => acc + Number(n.nota || 0), 0) / notasAlumno.length
    ).toFixed(2);

    return { porMateria, general: promedioGeneral, porCuatrimestre, porAnio };
  };

  const generarPDF = (alumno) => {
    const doc = new jsPDF();
    const promedios = calcularPromedios(alumno.id);
    const faltasAlumno = faltas.filter((f) => f.alumno_id === alumno.id && f.tipo === "falta").length;
    const tardesAlumno = faltas.filter((f) => f.alumno_id === alumno.id && f.tipo === "llegada_tarde").length;

    doc.text(`Boletín - ${alumno.nombre} ${alumno.apellido}`, 10, 10);
    doc.text(`Curso: ${alumno.cursos?.nombre || "Sin curso"}`, 10, 20);
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
    const faltasAlumno = faltas.filter((f) => f.alumno_id === alumno.id && f.tipo === "falta").length;
    const tardesAlumno = faltas.filter((f) => f.alumno_id === alumno.id && f.tipo === "llegada_tarde").length;

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ children: [new TextRun({ text: `Boletín - ${alumno.nombre} ${alumno.apellido}`, bold: true, size: 28 })] }),
            new Paragraph(`Curso: ${alumno.cursos?.nombre || "Sin curso"}`),
            new Paragraph(`Promedio general: ${promedios.general}`),
            ...Object.entries(promedios.porMateria).map(([materia, promedio]) =>
              new Paragraph(`${materia}: ${promedio}`)
            ),
            new Paragraph(`Faltas: ${faltasAlumno}`),
            new Paragraph(`Llegadas tarde: ${tardesAlumno}`)
          ]
        }
      ]
    });

    Packer.toBlob(doc).then((blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `boletin_${alumno.nombre}_${alumno.apellido}.docx`;
      link.click();
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Generar Boletines</h1>

      <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Documento</th>
            <th>Edad</th>
            <th>Curso</th>
            <th>Promedio General</th>
            <th>Faltas</th>
            <th>Llegadas Tarde</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {alumnos.map((alumno) => {
            const promedios = calcularPromedios(alumno.id);
            const faltasAlumno = faltas.filter((f) => f.alumno_id === alumno.id && f.tipo === "falta").length;
            const tardesAlumno = faltas.filter((f) => f.alumno_id === alumno.id && f.tipo === "llegada_tarde").length;

            return (
              <tr key={alumno.id}>
                <td>{alumno.nombre}</td>
                <td>{alumno.apellido}</td>
                <td>{alumno.documento}</td>
                <td>{alumno.edad}</td>
                <td>{alumno.cursos?.nombre || "Sin curso"}</td>
                <td>{promedios.general}</td>
                <td>{faltasAlumno}</td>
                <td>{tardesAlumno}</td>
                <td>
                  <button onClick={() => generarPDF(alumno)}>PDF</button>{" "}
                  <button onClick={() => generarWord(alumno)}>Word</button>
                </td>
              </tr>
            );
          })}
          {alumnos.length === 0 && (
            <tr>
              <td colSpan="15" style={{ textAlign: "center" }}>
                No hay alumnos registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
