document.addEventListener("DOMContentLoaded", () => {
  // ==================== Title Radio: อื่นๆ ====================
  const titleRadios = document.querySelectorAll('input[name="title"]');
  const titleOtherInput = document.getElementById("titleOtherText");

  titleRadios.forEach((r) => {
    r.addEventListener("change", () => {
      const isOther = document.getElementById("titleOtherRadio").checked;
      titleOtherInput.disabled = !isOther;
      titleOtherInput.required = isOther;
      if (!isOther) titleOtherInput.value = "";
    });
  });

  // ==================== Phone: ตัวเลขเท่านั้น ====================
  document.getElementById("phone").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
  });

  // ==================== Contact Checkbox ====================
  const contactCheckboxes = document.querySelectorAll('input[name="contact"]');
  const contactInput = document.getElementById("contactId");

  contactCheckboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      const anyChecked = [...contactCheckboxes].some((c) => c.checked);
      contactInput.disabled = !anyChecked;
      contactInput.required = anyChecked;
      if (!anyChecked) contactInput.value = "";
    });
  });

  // ==================== Custom Checkmarks & Radios ====================
  function initCustomMarks() {
    document
      .querySelectorAll('input[type="radio"], input[type="checkbox"]')
      .forEach((input) => {
        const mark = input.nextElementSibling;
        if (!mark) return;

        if (input.checked) mark.classList.add("checked");

        input.addEventListener("change", () => {
          if (input.type === "radio") {
            document
              .querySelectorAll(`input[name="${input.name}"]`)
              .forEach((radio) => {
                radio.nextElementSibling?.classList.remove("checked");
              });
          }
          mark.classList.toggle("checked", input.checked);
        });
      });
  }
  initCustomMarks();

  // ==================== Registration Status: Toggle Reason Inputs ====================
  function toggleRegInputs() {
    const incompleteChecked = document.getElementById("regIncomplete").checked;
    const otherChecked = document.getElementById("regOther").checked;

    const incompleteReasonInput = document.getElementById("incompleteReason");
    const otherReasonInput = document.getElementById("otherReason");

    incompleteReasonInput.disabled = !incompleteChecked;
    incompleteReasonInput.required = incompleteChecked;
    if (!incompleteChecked) incompleteReasonInput.value = "";

    otherReasonInput.disabled = !otherChecked;
    otherReasonInput.required = otherChecked;
    if (!otherChecked) otherReasonInput.value = "";
  }

  ["regComplete", "regIncomplete", "regOther"].forEach((id) => {
    document.getElementById(id).addEventListener("change", toggleRegInputs);
  });
  toggleRegInputs();

  // ==================== Date Input: Zero-pad ====================
  function padLeadingZeros(e) {
    const val = e.target.value;
    if (val !== "" && !isNaN(val) && val.length < 2) {
      e.target.value = val.padStart(2, "0");
    }
  }
  document.getElementById("sigDay").addEventListener("blur", padLeadingZeros);
  document.getElementById("sigMonth").addEventListener("blur", padLeadingZeros);

  // ==================== Signature Canvas ====================
  const canvas = document.getElementById("signatureCanvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  let drawing = false;

  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  function startDraw(e) {
    e.preventDefault();
    drawing = true;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function stopDraw() {
    drawing = false;
  }

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDraw);
  canvas.addEventListener("mouseleave", stopDraw);
  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  canvas.addEventListener("touchend", stopDraw);

  // ==================== Signature Modal ====================
  window.clearCanvas = () => ctx.clearRect(0, 0, canvas.width, canvas.height);

  window.openSignatureModal = () => {
    clearCanvas();
    document.getElementById("signatureModal").classList.add("open");
    document.body.classList.add("modal-open"); // BUG FIX: ต้นฉบับไม่ได้ toggle class นี้
  };

  window.closeSignatureModal = () => {
    document.getElementById("signatureModal").classList.remove("open");
    document.body.classList.remove("modal-open"); // BUG FIX: ต้นฉบับไม่ได้ toggle class นี้
  };

  window.saveSignature = () => {
    const dataURL = canvas.toDataURL("image/png", 1.0);
    document.getElementById("signatureData").value = dataURL;

    const img = document.getElementById("signaturePrev");
    img.src = dataURL;
    img.style.display = "block";
    document.getElementById("placeholderText").style.display = "none";

    closeSignatureModal();
  };

  // ปิด modal เมื่อ click นอก dialog
  document.getElementById("signatureModal").addEventListener("click", (e) => {
    if (e.target.id === "signatureModal") closeSignatureModal();
  });

  // ==================== Export PDF ====================
  // BUG FIX: ลบ A4_MM_W, A4_MM_H ที่ declare แต่ไม่ได้ใช้ออก
  window.exportPDF = async () => {
    const form = document.getElementById("FastTrackForm");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!document.getElementById("signatureData").value) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาลงนาม",
        text: "โปรดลงลายมือชื่อก่อนบันทึก PDF",
        confirmButtonColor: "#1a5276",
      });
      return;
    }

    const btn = document.getElementById("saveBtn");
    btn.disabled = true;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> กำลังสร้าง PDF...`;
    btn.style.display = "none";

    const A4_PX = 794;

    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 99998;
      background: #fff;
      display: flex; align-items: flex-start; justify-content: center;
      overflow: hidden;
    `;

    const container = document.createElement("div");
    container.style.cssText = `
      width: ${A4_PX}px;
      background: #fff;
      font-family: "Sarabun", serif;
      transform-origin: top left;
    `;
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    const originalGetPropertyValue =
      CSSStyleDeclaration.prototype.getPropertyValue;
    const originalGetComputedStyle = window.getComputedStyle;

    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      const pages = document.querySelectorAll(".page");
      const isSafariIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
      const scale = isSafariIOS ? 2.5 : 2;

      // Patch: ป้องกัน error จาก unsupported color functions (oklch, color-mix ฯลฯ)
      const unsafeColorPattern =
        /oklch\(|color-mix\(|lab\(|lch\(|oklab\(|color\(/i;

      function sanitizeColor(val, prop) {
        if (typeof val !== "string" || !unsafeColorPattern.test(val))
          return val;
        const p = (prop || "").toLowerCase();
        if (p.includes("background") || p.includes("bg-")) return "#ffffff";
        if (
          p.includes("border") ||
          p.includes("outline") ||
          p.includes("shadow") ||
          p.includes("ring")
        )
          return "transparent";
        return "#000000";
      }

      CSSStyleDeclaration.prototype.getPropertyValue = function (prop) {
        try {
          return sanitizeColor(originalGetPropertyValue.call(this, prop), prop);
        } catch {
          return "";
        }
      };

      window.getComputedStyle = function (el, pseudo) {
        const style = originalGetComputedStyle.call(window, el, pseudo);
        return new Proxy(style, {
          get(target, prop) {
            const val = target[prop];
            if (typeof val === "function") return val.bind(target);
            if (typeof val === "string") return sanitizeColor(val, prop);
            return val;
          },
        });
      };

      await document.fonts.ready;

      for (let i = 0; i < pages.length; i++) {
        const clone = pages[i].cloneNode(true);
        clone.style.cssText = `
          width: 794px !important;
          min-height: unset !important;
          margin: 0 !important;
          padding: 107px 84px !important;
          background: #fff !important;
          box-shadow: none !important;
          position: static !important;
          font-size: 15px !important;
          font-family: "Sarabun", serif !important;
        `;

        clone
          .querySelectorAll(".sig-placeholder, .bar, #saveBtn, .sig-modal")
          .forEach((el) => {
            el.style.display = "none";
          });

        clone.querySelectorAll("*").forEach((el) => {
          const cs = originalGetComputedStyle.call(window, el);
          const fw = cs.fontWeight;
          if (["lighter", "100", "200", "300"].includes(fw)) {
            el.style.fontWeight = "300";
          }
          el.style.fontFamily = '"Sarabun", serif';
          if (!el.style.color) el.style.color = "#000000";
        });

        clone
          .querySelectorAll(".section-title, .subsection-title, h1")
          .forEach((el) => {
            el.style.fontWeight = "400";
            el.style.fontSize = el.tagName === "H1" ? "16.5px" : "15px";
          });

        container.innerHTML = "";
        container.appendChild(clone);

        await new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        );

        const cvs = await html2canvas(container, {
          scale,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          width: A4_PX,
          windowWidth: A4_PX,
          scrollX: -window.scrollX,
          scrollY: -window.scrollY,
          imageTimeout: 0,
          onclone: (clonedDoc) => {
            const safeStyle = clonedDoc.createElement("style");
            safeStyle.textContent = `
              :root, *, *::before, *::after { color-scheme: light !important; }
              html, body { color: #000 !important; background: #fff !important; }
              p, label, input, span, div {
                font-family: "Sarabun", serif !important;
                font-weight: 300 !important;
              }
              h1 {
                font-family: "Sarabun", serif !important;
                font-weight: 400 !important;
                font-size: 16.5px !important;
              }
              .section-title, .subsection-title {
                font-weight: 400 !important;
                font-size: 15px !important;
              }
              input { font-weight: 300 !important; }
            `;
            clonedDoc.head.appendChild(safeStyle);

            clonedDoc.querySelectorAll("style").forEach((s) => {
              if (/oklch|color-mix|color\(display/.test(s.textContent)) {
                s.remove();
              }
            });
          },
        });

        const imgData = cvs.toDataURL("image/png", 1.0);
        const imgWidth = 210;
        const imgHeight = (cvs.height * imgWidth) / cvs.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, Math.min(imgHeight, 297));
      }

      const pdfBlob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "ใบสมัคร Fast Track.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        text: "บันทึกสำเร็จ",
        confirmButtonColor: "#1a5276",
        timer: 2500,
        timerProgressBar: true,
      }).then(() => window.location.reload());
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถสร้าง PDF ได้ กรุณาลองใหม่",
        confirmButtonColor: "#c0392b",
      });
    } finally {
      CSSStyleDeclaration.prototype.getPropertyValue = originalGetPropertyValue;
      window.getComputedStyle = originalGetComputedStyle;
      document.body.removeChild(overlay);
      btn.style.display = "flex";
      btn.disabled = false;
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> บันทึก PDF`;
    }
  };

  // Spin animation for loading state
  const spinStyle = document.createElement("style");
  spinStyle.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
  document.head.appendChild(spinStyle);
});