
export class ExportService {
    static async captureImage(canvas: HTMLCanvasElement): Promise<void> {
        // Create a temporary link
        const link = document.createElement('a');
        link.download = `sensitivity_snapshot_${new Date().getTime()}.png`;

        // High quality export
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    }

    static async capturehighResImage(elementId: string): Promise<void> {
        // Find the node
        const node = document.getElementById(elementId);
        if (!node) throw new Error("Element not found");

        // NOTE: In a real implementation we would use html2canvas or dom-to-image
        // For this demo, we assume the WebGL canvas is the primary target
        const canvas = node.querySelector('canvas');
        if (canvas) {
            return this.captureImage(canvas);
        } else {
            console.warn("No canvas found to export");
        }
    }

    static recordsStream(canvas: HTMLCanvasElement, durationMs: number = 3000): Promise<void> {
        return new Promise((resolve) => {
            const stream = canvas.captureStream(60); // 60 FPS
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `sensitivity_video_${new Date().getTime()}.webm`;
                a.click();
                resolve();
            };

            recorder.start();
            setTimeout(() => recorder.stop(), durationMs);
        });
    }
}
