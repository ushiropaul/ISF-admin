import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient.js";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";

export default function Boletines() {
  const [notas, setNotas] = useState([]);
  const [faltas, setFaltas] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [search, setSearch] = useState("");

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
    const { data: notasData } = await supabase
      .from("notas")
      .select(`
        id,
        alumno_id,
        calificacion,
        fecha,
        cuatrimestre,
        curso_materia:curso_materia_id (
          materia:materia_id (
            id,
            nombre
          )
        )
      `);

    const { data: faltasData } = await supabase.from("asistencias").select("*");

    const { data: alumnosData } = await supabase
      .from("alumnos")
      .select(`
        id,
        nombre,
        apellido,
        documento,
        edad,
        curso_id,
        cursos(nombre)
      `);

    setNotas(notasData || []);
    setFaltas(faltasData || []);
    setAlumnos(alumnosData || []);
  };

  const calcularPromedios = (alumnoId) => {
    const notasAlumno = notas.filter((n) => n.alumno_id === alumnoId);
    if (!notasAlumno.length) return { porMateria: {}, general: 0, porCuatrimestre: {}, porAnio: {} };

    const porMateria = {};
    const porCuatrimestre = {};
    const porAnio = {};

    notasAlumno.forEach((n) => {
      const materia = n.curso_materia?.materia?.nombre || "Sin materia";

      if (!porMateria[materia]) porMateria[materia] = [];
      porMateria[materia].push(Number(n.calificacion || 0));

      const claveCuatr = `${materia} - C${n.cuatrimestre}`;
      if (!porCuatrimestre[claveCuatr]) porCuatrimestre[claveCuatr] = [];
      porCuatrimestre[claveCuatr].push(Number(n.calificacion || 0));

      const anio = new Date(n.fecha).getFullYear();
      const claveAnio = `${materia} - ${anio}`;
      if (!porAnio[claveAnio]) porAnio[claveAnio] = [];
      porAnio[claveAnio].push(Number(n.calificacion || 0));
    });

    for (const key in porMateria)
      porMateria[key] = (porMateria[key].reduce((a, b) => a + b, 0) / porMateria[key].length).toFixed(2);

    for (const key in porCuatrimestre)
      porCuatrimestre[key] = (porCuatrimestre[key].reduce((a, b) => a + b, 0) / porCuatrimestre[key].length).toFixed(2);

    for (const key in porAnio)
      porAnio[key] = (porAnio[key].reduce((a, b) => a + b, 0) / porAnio[key].length).toFixed(2);

    const promedioGeneral = (
      notasAlumno.reduce((acc, n) => acc + Number(n.calificacion || 0), 0) / notasAlumno.length
    ).toFixed(2);

    return { porMateria, general: promedioGeneral, porCuatrimestre, porAnio };
  };

  // Aquí irían las funciones generarPDF y generarWord mejoradas (sin cambios respecto a lo que ya tienes)

  // ---------------- Filtrar alumnos ----------------
  const alumnosFiltrados = alumnos.filter((al) =>
    al.nombre.toLowerCase().includes(search.toLowerCase()) ||
    al.apellido.toLowerCase().includes(search.toLowerCase()) ||
    (al.documento && al.documento.includes(search))
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Generar Boletines</h1>

      {/* Input de búsqueda */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, apellido o documento"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 w-full"
        />
      </div>

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
          {alumnosFiltrados.map((alumno) => {
            const promedios = calcularPromedios(alumno.id);
            const faltasAlumno = faltas.filter((f) => f.alumno_id === alumno.id && f.tipo === "falta").length;
            const tardesAlumno = faltas.filter((f) => f.alumno_id === alumno.id && f.tipo === "llegada_tarde").length;

            return (
              <React.Fragment key={alumno.id}>
                <tr>
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

                {/* Tabla adicional: Promedios detallados */}
                <tr>
                  <td colSpan="9">
                    <strong>Promedios por materia:</strong>
                    <ul>
                      {Object.entries(promedios.porMateria).map(([materia, prom]) => (
                        <li key={materia}>{materia}: {prom}</li>
                      ))}
                    </ul>
                    <strong>Promedios por cuatrimestre:</strong>
                    <ul>
                      {Object.entries(promedios.porCuatrimestre).map(([clave, prom]) => (
                        <li key={clave}>{clave}: {prom}</li>
                      ))}
                    </ul>
                    <strong>Promedios por año:</strong>
                    <ul>
                      {Object.entries(promedios.porAnio).map(([clave, prom]) => (
                        <li key={clave}>{clave}: {prom}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
          {alumnosFiltrados.length === 0 && (
            <tr>
              <td colSpan="9" style={{ textAlign: "center" }}>
                No hay alumnos registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
