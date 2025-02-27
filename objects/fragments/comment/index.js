const commentVisibility = fragmentElement.querySelector('.comment-visibility');
const visibility = commentVisibility.textContent;
if (visibility === 'Public') {
	commentVisibility.classList.add('label-danger');
} else if (visibility === 'Internal') {
	commentVisibility.classList.add('label-warning');
}