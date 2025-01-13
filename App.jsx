import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [courses, setCourses] = useState([]); // Kõik kursused
  const [filteredCourses, setFilteredCourses] = useState([]); // Filtreeritud kursused
  const [filter, setFilter] = useState(""); // Filtritekst
  const [selectedCourse, setSelectedCourse] = useState(""); // Valitud kursus
  const [schedule, setSchedule] = useState({}); // Tunniplaan
  const [loading, setLoading] = useState(false); // Laadimisindikaator
  const [error, setError] = useState(""); // Veateade

  // Fetch courses on component mount
  useEffect(() => {
    console.log("Fetching courses...");
    fetch(
      "https://siseveeb.voco.ee/veebilehe_andmed/oppegrupid?seisuga=not_ended"
    )
      .then((response) => response.text())
      .then((text) => {
        console.log("Raw API Response (Text):", text);
        let parsedData;

        try {
          const cleanedText = text.replace(/\\+/g, ""); 
          const firstParse = JSON.parse(cleanedText);
          parsedData =
            typeof firstParse === "string" ? JSON.parse(firstParse) : firstParse;

          if (parsedData && Array.isArray(parsedData.grupid)) {
            setCourses(parsedData.grupid);
            setFilteredCourses(parsedData.grupid); 
          } else {
            console.error("`grupid` is undefined or not an array.");
            setError("Kursuseid ei leitud.");
          }
        } catch (err) {
          console.error("Error parsing JSON response:", err);
          setError("Viga kursuste andmete töötlemisel.");
        }
      })
      .catch((error) => {
        console.error("Error fetching courses:", error);
        setError("Viga kursuste laadimisel.");
      });
  }, []);

  const handleFilterChange = (e) => {
    const value = e.target.value.toLowerCase();
    setFilter(value);
    setFilteredCourses(
      courses.filter(
        (course) =>
          course.tahis.toLowerCase().includes(value) ||
          (course.nimetus && course.nimetus.toLowerCase().includes(value))
      )
    );
  };

  // Fetch schedule for the selected course
  const fetchSchedule = (courseId) => {
    setLoading(true);
    setError(""); // Clear previous errors
    const currentWeek = new Date().toISOString().split("T")[0];

    fetch(
      `https://siseveeb.voco.ee/veebilehe_andmed/tunniplaan?nadal=${currentWeek}&grupp=${courseId}`
    )
      .then((response) => response.json())
      .then((data) => {
        console.log("Schedule data from API (Full):", JSON.stringify(data, null, 2));
        setSchedule(data.tunnid || {}); 
      })
      .catch((error) => {
        console.error("Error fetching schedule:", error);
        setError("Viga tunniplaani laadimisel.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    if (courseId) fetchSchedule(courseId);
  };

  return (
    <div>
      <h1>VOCO TUNNIPLAAN</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div>
        <input
          type="text"
          value={filter}
          onChange={handleFilterChange}
          placeholder="Filtreeri kursusi (nt ITA, AM...)"
          style={{ marginBottom: "10px", padding: "5px", width: "300px" }}
        />
      </div>
      <div>
        <select value={selectedCourse} onChange={handleCourseChange}>
          <option value="">Vali kursus</option>
          {filteredCourses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.tahis}  {course.nimetus}
            </option>
          ))}
        </select>
      </div>
      <div>
        {loading ? (
          <p>Laadin tunniplaani...</p>
        ) : Object.keys(schedule).length > 0 ? (
          Object.entries(schedule).map(([date, hours]) => (
            <div key={date}>
              <h2>{date}</h2>
              <table>
                <thead>
                  <tr>
                    <th>Algus</th>
                    <th>Lõpp</th>
                    <th>Aine</th>
                    <th>Õpetaja</th>
                    <th>Ruum</th>
                  </tr>
                </thead>
                <tbody>
                  {hours.map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.algus || "N/A"}</td>
                      <td>{entry.lopp || "N/A"}</td>
                      <td>{entry.aine || "N/A"}</td>
                      <td>{entry.opetaja || "N/A"}</td>
                      <td>{entry.ruum || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        ) : (
          <p>Vali kursus, et näha tunniplaani.</p>
        )}
      </div>
    </div>
  );
}

export default App;
