export class VFX {
    trigger(imgElement) {
        imgElement.classList.add('glitch-active');
        setTimeout(() => {
            imgElement.classList.remove('glitch-active');
        }, 200);
    }
}
