/*
 * For this fragment to work with unauthenticated requests, you
 * need to update a Service Access Policy to allow access to
 * com.liferay.headless.delivery.internal.resource.v1_0.DocumentResourceImpl#getDocument
 */
const overlayBackground = fragmentElement.querySelector('.overlay-background');
const queries = {
  thumbnail: window.matchMedia('(max-width:300px)'),
  preview: window.matchMedia('(max-width:1000px) and (min-width:300px)'),
};

const fileEntryId = configuration.backgroundImage?.fileEntryId;
Liferay.Util.fetch(
  `/o/headless-delivery/v1.0/documents/${fileEntryId}?fields=adaptedImages,contentUrl`
)
  .then(async (response) => {
    const { status } = response;
    const responseContentType = response.headers.get('content-type');
    if (status === 204) {
      return { status };
    } else if (!response.ok) {
      let content;
      if (responseContentType === 'application/json') {
        content = await response.json();
      } else {
        content = await response.text();
      }
      throw {
        message: 'Error while fetching document details',
        fileEntryId,
        status,
        content,
        contentType: responseContentType,
      };
    } else {
      if (responseContentType === 'application/json') {
        return response.json();
      } else {
        return response.text();
      }
    }
  })
  .then((data) => {
    const contentUrl = data?.contentUrl;
    const adaptedImages = data.adaptedImages?.map((image) => {
      const width = image.width;
      const url = image.contentUrl;
      return { width, url };
    });

    const updateImage = () => {
      let imageSrc = '';

      if (queries.thumbnail.matches) {
        const image = adaptedImages.find((image) => image.width === 300);
        imageSrc = image.url;
      } else if (queries.preview.matches) {
        const image = adaptedImages.find((image) => image.width === 1000);
        imageSrc = image.url;
      } else {
        imageSrc = contentUrl;
      }

      overlayBackground.style.setProperty(
        '--background-image',
        `url(${imageSrc})`
      );
    };

    updateImage();

    Object.values(queries).forEach((q) =>
      q.addEventListener('change', updateImage)
    );
  })
  .catch((reason) => {
    if (reason.status === 403) {
      console.warn(
        'The user does not have the permissions to access /o/headless-delivery/v1.0/documents/${documentId}'
      );
    } else {
      console.error('Unexpected error while fetching document details', reason);
    }
  });
