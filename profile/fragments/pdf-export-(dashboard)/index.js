if (!fragmentNamespace) {
	return;
}

if (document.body.classList.contains('has-edit-mode-menu')) {
	// If present then we are in content page editor
	return;
}

const pdfClickHandler = (evt) => {
	const profileDivId = evt.target.getAttribute('profileDivId');
	const filename = evt.target.getAttribute('filename');
	const { jsPDF } = window.jspdf;
	const doc = new jsPDF('p', 'pt', 'a4');
	var wrapper = document.getElementById(profileDivId);
	if (wrapper)
	{
		const source = wrapper;
		doc.html(source, {
			callback: function (pdf) {
				pdf.save(`${filename}.pdf`);
			},
			x: 10,
			y: 10
		});
	}
};

const loadScript = (FILE_URL, async = true, type = "text/javascript") => {
	return new Promise((resolve, reject) => {
		try {
			const scriptEle = document.createElement("script");
			scriptEle.type = type;
			scriptEle.async = async;
			scriptEle.src =FILE_URL;

			scriptEle.addEventListener("load", (ev) => {
				resolve({ status: true });
			});

			scriptEle.addEventListener("error", (ev) => {
				reject({
					status: false,
					message: `Failed to load the script ${FILE_URL}`
				});
			});

			document.body.appendChild(scriptEle);
		} catch (error) {
			reject(error);
		}
	});
};

loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js")
    .then( data  => {
        console.log("html2canvas.min.js loaded successfully", data);
    })
    .catch( err => {
        console.error(err);
    });

loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
    .then( data  => {
        console.log("jspdf.umd.min.js loaded successfully", data);
    })
    .catch( err => {
        console.error(err);
    });

document.addEventListener('DOMContentLoaded', () => {
	const pdfButton = fragmentElement.querySelector("button");
	pdfButton.addEventListener('click', pdfClickHandler);
});