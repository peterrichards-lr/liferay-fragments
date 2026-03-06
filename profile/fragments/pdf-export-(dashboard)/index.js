const initPdfExportDashboard = () => {
  if (layoutMode === "view") {
    const pdfClickHandler = (evt) => {
      const profileDivId = evt.target.getAttribute("profileDivId");
      const filename = evt.target.getAttribute("filename");
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF("p", "pt", "a4");
      var wrapper = document.getElementById(profileDivId);
      if (wrapper) {
        const source = wrapper;
        doc.html(source, {
          callback: function (pdf) {
            pdf.save(`${filename}.pdf`);
          },
          x: 10,
          y: 10,
        });
      }
    };

    const loadScript = (FILE_URL, async = true, type = "text/javascript") => {
      return new Promise((resolve, reject) => {
        try {
          const scriptEle = document.createElement("script");
          scriptEle.type = type;
          scriptEle.async = async;
          scriptEle.src = FILE_URL;

          scriptEle.addEventListener("load", (ev) => {
            resolve({ status: true });
          });

          scriptEle.addEventListener("error", (ev) => {
            reject({
              status: false,
              message: `Failed to load the script ${FILE_URL}`,
            });
          });

          document.body.appendChild(scriptEle);
        } catch (error) {
          reject(error);
        }
      });
    };

    Promise.all([
      loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      ),
      loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      ),
    ])
      .then(() => {
        console.log("PDF libraries loaded successfully for dashboard");
        const pdfButton = fragmentElement.querySelector("button");
        if (pdfButton) {
          pdfButton.addEventListener("click", pdfClickHandler);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }
};

initPdfExportDashboard();
