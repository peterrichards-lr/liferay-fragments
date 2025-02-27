

const locales = Liferay.ThemeDisplay.getLanguageId().replaceAll('_', '-');

const formatDate = (date) => {
  const dateOptions = {
    year: "numeric",
    month: "long",
    day: "numeric"
  };
  const dateParts = new Intl.DateTimeFormat(locales, dateOptions
  ).formatToParts();
  const createSortFunction = (property) => {
    return (a, b) => {
      if (a[property] < b[property]) return -1;
      if (a[property] > b[property]) return 1;
      return 0;
    }
  };
  const sortFunction = createSortFunction('type');
  const [day, month, year] = dateParts.filter((part) => "daymonthyear".indexOf(part.type) > -1).sort(sortFunction).map((part) => part.value);
  const dateStr = `${day} ${month} ${year}`;

  const timeOptions = {
    hour: "numeric",
    minute: "numeric", hour12: false
  };
  const time =
    new Intl.DateTimeFormat(locales, timeOptions).format();

  return `${dateStr} at ${time}`;
}

const getTicketId = () => {
  const urlParams = new URLSearchParams(document.location.search);
  let id = null;

  if (configuration.useDummyId && !isNaN(configuration.dummyId)) {
    return parseInt(configuration.dummyId);
  } else if (configuration.sourceMethod === 'path') {
    const pathPosition = configuration.pathPosition;
    const pathTokens = document.location.pathname.split('/')
    if (pathTokens && !isNaN(pathPosition)) {
      id = pathTokens.slice(pathPosition)[0];
    }
  } else if (configuration.sourceMethod === 'queryString') {
    const idParameter = configuration.idParameter;
    id = urlParams.get(idParameter);
  } else {
    console.warn(`Unknown sourceMethod: ${sourceMethod}`);
  }
  return id;
}

const ticketId = getTicketId();
if (ticketId) {
  const viewComments = fragmentElement.querySelector('.view-comments');

  const renderComments = (comments) => {
    comments.forEach(renderComment);
  };

  const renderComment = (comment) => {
    const temp = fragmentElement.querySelector('template');
    const commentEL = temp.content.cloneNode(true);
    const img = commentEL.querySelector('img.commenter-image');
    img.setAttribute('src', comment.creator.image);
    const name = commentEL.querySelector('span.commenter-name');
    name.textContent = comment.creator.name;
    const text = commentEL.querySelector('span.comment');
    text.innerHTML = comment.comment;
    const dateTime = commentEL.querySelector('span.comment-date-time');
    const date = new Date(comment.dateCreated);
    dateTime.textContent = formatDate(date);
    viewComments.appendChild(commentEL);
  };

  const filter = `r_ticket_c_j3y7TicketId eq '${ticketId}' and visibility eq 'Public'`;
  Liferay.Util.fetch(`https://webserver-lctlcapforresterdemo-uat.lfr.cloud/o/c/j3y7comments/?filter=${filter}`)
    .then((response) => response.json())
    .then((data) => renderComments(data["items"]));
}