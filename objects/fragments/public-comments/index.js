const initPublicComments = () => {
  const { isValidIdentifier, resolveObjectPathByERC } =
    Liferay.Fragment.Commons;

  const locales = Liferay.ThemeDisplay.getLanguageId().replaceAll("_", "-");

  const formatDate = (date) => {
    const dateOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const dateParts = new Intl.DateTimeFormat(
      locales,
      dateOptions,
    ).formatToParts();
    const createSortFunction = (property) => {
      return (a, b) => {
        if (a[property] < b[property]) return -1;
        if (a[property] > b[property]) return 1;
        return 0;
      };
    };
    const sortFunction = createSortFunction("type");
    const [day, month, year] = dateParts
      .filter((part) => "daymonthyear".indexOf(part.type) > -1)
      .sort(sortFunction)
      .map((part) => part.value);
    const dateStr = `${day} ${month} ${year}`;

    const timeOptions = {
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    };
    const time = new Intl.DateTimeFormat(locales, timeOptions).format();

    return `${dateStr} at ${time}`;
  };

  const getTicketId = () => {
    const urlParams = new URLSearchParams(document.location.search);
    let id = null;

    if (configuration.useDummyId && !isNaN(configuration.dummyId)) {
      return configuration.dummyId;
    } else if (configuration.sourceMethod === "path") {
      const pathPosition = configuration.pathPosition;
      const pathTokens = document.location.pathname.split("/");
      if (pathTokens && !isNaN(pathPosition)) {
        id = pathTokens.slice(pathPosition)[0];
      }
    } else if (configuration.sourceMethod === "queryString") {
      const idParameter = configuration.idParameter;
      id = urlParams.get(idParameter);
    } else {
      console.warn(`Unknown sourceMethod: ${configuration.sourceMethod}`);
    }
    return id;
  };

  let apiPath = "";

  const resolveApiPath = async () => {
    const objectERC = configuration.objectERC;
    if (!isValidIdentifier(objectERC)) {
      apiPath = configuration.objectAPIPath || "/o/c/j3y7comments/";
      return;
    }

    try {
      const result = await resolveObjectPathByERC(objectERC);

      if (result.apiPath) {
        apiPath = result.apiPath;
      } else {
        apiPath = configuration.objectAPIPath || "/o/c/j3y7comments/";
      }
    } catch (err) {
      console.error(err);
      apiPath = configuration.objectAPIPath || "/o/c/j3y7comments/";
    }
  };

  const ticketId = getTicketId();
  if (isValidIdentifier(ticketId)) {
    const viewComments = fragmentElement.querySelector(".view-comments");

    const renderComment = (comment) => {
      const temp = fragmentElement.querySelector("template");
      if (!temp) return;
      const commentEL = temp.content.cloneNode(true);
      const img = commentEL.querySelector("img.commenter-image");
      if (img && comment.creator)
        img.setAttribute("src", comment.creator.image);
      const name = commentEL.querySelector("span.commenter-name");
      if (name && comment.creator) name.textContent = comment.creator.name;
      const text = commentEL.querySelector("span.comment");
      if (text) text.innerHTML = comment.comment;
      const dateTime = commentEL.querySelector("span.comment-date-time");
      if (dateTime) {
        const date = new Date(comment.dateCreated);
        dateTime.textContent = formatDate(date);
      }
      viewComments.appendChild(commentEL);
    };

    const fetchComments = async () => {
      if (!apiPath) await resolveApiPath();

      const relationshipFieldName =
        configuration.relationshipFieldName || "r_ticket_c_j3y7TicketId";
      const filter = `${relationshipFieldName} eq '${ticketId}' and visibility eq 'Public'`;

      try {
        const response = await Liferay.Util.fetch(
          `${apiPath}?filter=${filter}`,
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch comments: ${response.status} ${response.statusText}`,
          );
        }
        const data = await response.json();
        if (data && data.items) {
          data.items.forEach(renderComment);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
        if (viewComments && layoutMode === "edit") {
          viewComments.innerHTML = `<div class="alert alert-danger">Error fetching comments. Check configuration and permissions.</div>`;
        }
      }
    };

    fetchComments();
  }
};

initPublicComments();
