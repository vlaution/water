import { heatmapVertexShader, heatmapFragmentShader } from './gl/heatmap';

export class WebGLVisualizationEngine {
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private positionLocation: number;
    private texCoordLocation: number;
    private positionBuffer: WebGLBuffer;
    private texCoordBuffer: WebGLBuffer;

    // Uniforms
    private uResolutionLoc: WebGLUniformLocation | null = null;
    private uDataTextureLoc: WebGLUniformLocation | null = null;
    private uMinValueLoc: WebGLUniformLocation | null = null;
    private uMaxValueLoc: WebGLUniformLocation | null = null;
    private uContourLinesLoc: WebGLUniformLocation | null = null;

    // Probability Uniforms
    private uProbCenterLoc: WebGLUniformLocation | null = null;
    private uProbStdDevLoc: WebGLUniformLocation | null = null;

    private texture: WebGLTexture;

    constructor(canvas: HTMLCanvasElement) {
        const gl = canvas.getContext('webgl2');
        if (!gl) throw new Error("WebGL2 not supported");
        this.gl = gl;

        // Init Pipeline
        const vs = this.createShader(this.gl.VERTEX_SHADER, heatmapVertexShader);
        const fs = this.createShader(this.gl.FRAGMENT_SHADER, heatmapFragmentShader);
        this.program = this.createProgram(vs, fs);

        this.positionLocation = this.gl.getAttribLocation(this.program, "a_position");
        this.texCoordLocation = this.gl.getAttribLocation(this.program, "a_texCoord");

        // Create Buffers
        this.positionBuffer = this.gl.createBuffer()!;
        this.texCoordBuffer = this.gl.createBuffer()!;

        // Quad Setup (Full Canvas)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.setRectangle(0, 0, canvas.width, canvas.height);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.setRectangle(0, 0, 1.0, 1.0); // Texture coords 0 to 1

        // Uniforms
        this.uResolutionLoc = this.gl.getUniformLocation(this.program, "u_resolution");
        this.uDataTextureLoc = this.gl.getUniformLocation(this.program, "u_dataTexture");
        this.uMinValueLoc = this.gl.getUniformLocation(this.program, "u_minValue");
        this.uMaxValueLoc = this.gl.getUniformLocation(this.program, "u_maxValue");

        this.uContourLinesLoc = this.gl.getUniformLocation(this.program, "u_contourLines");
        this.uProbCenterLoc = this.gl.getUniformLocation(this.program, "u_probCenter");
        this.uProbStdDevLoc = this.gl.getUniformLocation(this.program, "u_probStdDev");

        // Texture Setup
        this.texture = this.gl.createTexture()!;
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    }

    public render(data: Float32Array, width: number, height: number, minVal: number, maxVal: number, probCenter: [number, number] = [0.5, 0.5], probStdDev: [number, number] = [0.2, 0.2]) {
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.useProgram(this.program);

        // Bind Position
        this.gl.enableVertexAttribArray(this.positionLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.setRectangle(0, 0, this.gl.canvas.width, this.gl.canvas.height); // Update viewport rect
        this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        // Bind TexCoord
        this.gl.enableVertexAttribArray(this.texCoordLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        // Coords 0,0 to 1,1 are static in buffer, no need to update
        this.gl.vertexAttribPointer(this.texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);

        // Update Texture
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

        // R32F is single channel float texture
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.R32F,
            width,
            height,
            0,
            this.gl.RED,
            this.gl.FLOAT,
            data
        );

        // Set Uniforms
        this.gl.uniform2f(this.uResolutionLoc, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.uniform1i(this.uDataTextureLoc, 0);
        this.gl.uniform1f(this.uMinValueLoc, minVal);
        this.gl.uniform1f(this.uMaxValueLoc, maxVal);

        this.gl.uniform1i(this.uContourLinesLoc, 5); // 5 contour lines
        this.gl.uniform2f(this.uProbCenterLoc, probCenter[0], probCenter[1]);
        this.gl.uniform2f(this.uProbStdDevLoc, probStdDev[0], probStdDev[1]);

        // Draw
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    private createShader(type: number, source: string): WebGLShader {
        const shader = this.gl.createShader(type)!;
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const infolog = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Shader compile failed: ${infolog}`);
        }
        return shader;
    }

    private createProgram(vs: WebGLShader, fs: WebGLShader): WebGLProgram {
        const program = this.gl.createProgram()!;
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const infolog = this.gl.getProgramInfoLog(program);
            throw new Error(`Program link failed: ${infolog}`);
        }
        return program;
    }

    private setRectangle(x: number, y: number, width: number, height: number) {
        const x1 = x;
        const x2 = x + width;
        const y1 = y;
        const y2 = y + height;
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2,
        ]), this.gl.STATIC_DRAW);
    }
}
