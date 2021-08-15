<template>
  <PinchScrollZoom
    ref="zoomer"
    :width="width"
    :height="height"
    :within="within"
    :content-width="contentWidth"
    :content-height="contentHeight"
    :throttle-delay="40"
    @scaling="onScaling"
    @dragging="onDragging"
    :scale="scale"
    :min-scale="_minScale"
    :max-scale="_maxScale"
    :draggable="draggable"
  >
    <div class="map-hexagon" :style="getMapStyles">
      <div
        v-for="cell in _cells"
        :key="cell.index"
        :style="getPositionStyles(cell.col, cell.row)"
        class="map-hexagon__item"
      >
        <slot
          :index="cell.index"
          :item-size="itemSize"
          :col="cell.col"
          :row="cell.row"
        >
          <Hexagon
            :size="itemSize"
            :class="cell.hexagonClass"
            :border-size="cell.borderSize"
            :border-color="cell.borderColor"
            :background-color="cell.backgroundColor"
            :background-image="cell.backgroundImage"
            @click="() => $emit('click', cell)"
          >
            <span
              v-if="cell.text"
              v-html="cell.text"
              :style="cell.textStyle || {}"
            ></span>
          </Hexagon>
        </slot>
      </div>
    </div>
  </PinchScrollZoom>
</template>

<script lang="ts">
import Vue from "vue";
import PinchScrollZoom from "@coddicat/vue-pinch-scroll-zoom";
import { HexagonCell, HexagonCellData } from "./types";
import { PinchScrollZoomEmitData } from "@coddicat/vue-pinch-scroll-zoom";
import Hexagon from "@coddicat/vue-hexagon";
const angle = (Math.PI / 180) * 60;

export default /*#__PURE__*/ Vue.extend({
  name: "MapHexagon",
  components: {
    PinchScrollZoom,
    Hexagon,
  },
  props: {
    cells: {
      type: Array,
      required: false,
      default: undefined,
    },
    width: {
      type: Number,
      default: 400,
    },
    height: {
      type: Number,
      default: 400,
    },
    xRange: {
      type: Array,
      default(): number[] {
        if (!this.cells) {
          return [-5, 5];
        }
        const arr = this.cells.map((x: HexagonCell) => x.col);
        const min = Math.min.apply(null, arr);
        const max = Math.max.apply(null, arr);

        return [min, max];
      },
    },
    yRange: {
      type: Array,
      default(): number[] {
        if (!this.cells) {
          return [-5, 5];
        }
        const arr = this.cells.map((x: any) => x.row);
        const min = Math.min.apply(null, arr);
        const max = Math.max.apply(null, arr);

        return [min, max];
      },
    },
    itemSize: {
      type: Number,
      default: 100,
    },
    itemsGap: {
      type: Number,
      default: 5,
    },
    within: {
      type: Boolean,
      default: false,
    },
    zoom: {
      type: Boolean,
      default: true,
    },
    minScale: {
      type: Number,
      default: 0.6,
    },
    maxScale: {
      type: Number,
      default: 3,
    },
    center: {
      type: Array,
      default(): Array<number> {
        const xRange = this.xRange as Array<number>;
        const yRange = this.yRange as Array<number>;

        const x = Math.floor((xRange[0] + xRange[1]) / 2);
        const y = Math.floor((yRange[0] + yRange[1]) / 2);
        return [x, y];
      },
    },
    scale: {
      type: Number,
      default: 1,
    },
    autoCenter: {
      type: Boolean,
      default: true,
    },
    draggable: {
      type: Boolean,
      default: true,
    },
  },
  mounted() {
    this.draggingListener = !!this.$listeners.dragging;
    this.scalingListener = !!this.$listeners.scaling;

    if (this.autoCenter) {
      this.submitCenter();
    } else {
      const event: PinchScrollZoomEmitData = {
        x: 0,
        y: 0,
        originX: 0,
        originY: 0,
        scale: this.currentScale,
        translateX: 0,
        translateY: 0,
      };
      this.onDragging(event);
    }
  },
  watch: {
    center() {
      if (this.autoCenter) {
        this.submitCenter();
      }
    },
    height() {
      this.submitSize();
    },
    width() {
      this.submitSize();
    },
  },
  data(): any {
    return {
      currentScale: this.scale,
      visibleLeft: 0,
      visibleTop: 0,
      visibleRight: 0,
      visibleBottom: 0,
      draggingListener: false,
      scalingListener: false,
    };
  },
  computed: {
    getMapStyles(): any {
      return { transform: `translate(${-this.xOffset}px, ${-this.yOffset}px)` };
    },
    radius(): number {
      return this.itemSize / 2 + this.itemsGap;
    },
    xfactor(): number {
      return this.radius * Math.cos(angle) + this.radius;
    },
    yfactor(): number {
      return this.radius * Math.sin(angle);
    },
    xOffset(): number {
      const cnx = this.getXposition(this.xRange[0]);
      return cnx - this.radius;
    },
    contentWidth(): number {
      const res =
        (this.xRange[1] - this.xRange[0] + 1) * this.xfactor + this.radius / 2;
      return res;
    },
    yOffset(): number {
      const cny = this.getYposition(0, this.yRange[0]);
      return cny - this.yfactor;
    },
    contentHeight(): number {
      const res =
        (this.yRange[1] - this.yRange[0] + 1) * this.yfactor * 2 + this.yfactor;
      return res;
    },
    _cells(): Array<HexagonCell | HexagonCellData> {
      const cols = this.xRange[1] - this.xRange[0] + 1;
      const cells = [];

      const top =
        this.yRange[0] > this.visibleTop ? this.yRange[0] : this.visibleTop;

      const bottom =
        this.yRange[1] < this.visibleBottom
          ? this.yRange[1]
          : this.visibleBottom;

      const left =
        this.xRange[0] > this.visibleLeft ? this.xRange[0] : this.visibleLeft;

      const right =
        this.xRange[1] < this.visibleRight ? this.xRange[1] : this.visibleRight;

      if (this.cells) {
        return this.cells.filter(
          (x: HexagonCell) =>
            x.row >= top && x.row <= bottom && x.col >= left && x.col <= right
        );
      }

      for (let row = top; row <= bottom; row++) {
        for (let col = left; col <= right; col++) {
          const cell: HexagonCellData = {
            index: row * cols + col,
            col,
            row,
          };
          cells.push(cell);
        }
      }

      return cells;
    },
    _minScale(): number {
      return this.zoom ? this.minScale : this.maxScale;
    },
    _maxScale(): number {
      return this.zoom ? this.maxScale : this.minScale;
    },
  },
  methods: {
    onDragging(event: PinchScrollZoomEmitData): void {
      const scale = event.scale;
      const originX = event.originX;
      const originY = event.originY;

      const scaleFactorX = scale * this.xfactor;
      const floatLeft = (originX * scale - event.x - originX) / scaleFactorX;
      const floatRight = floatLeft + this.width / scaleFactorX;
      this.visibleLeft = Math.floor(floatLeft) + this.xRange[0] - 1;
      this.visibleRight = Math.floor(floatRight) + this.xRange[0];

      const scaleFactorY = scale * this.yfactor * 2;
      const floatTop = (originY * scale - event.y - originY) / scaleFactorY;
      const floatBottom = floatTop + this.height / scaleFactorY;
      this.visibleTop = Math.floor(floatTop) + this.yRange[0] - 1;
      this.visibleBottom = Math.floor(floatBottom) + this.yRange[0];

      if (this.draggingListener) {
        this.$emit("dragging", event);
      }
    },
    onScaling(event: PinchScrollZoomEmitData): void {
      this.onDragging(event);
      this.currentScale = event.scale;
      if (this.scalingListener) {
        this.$emit("scaling", event);
      }
    },
    submitCenter(): void {
      this.$nextTick(() => {
        const xCenter = this.getXcenter();
        const yCenter = this.getYcenter();
        this.$refs.zoomer.setData({
          scale: this.currentScale,
          originX: 0,
          originY: 0,
          translateX: xCenter,
          translateY: yCenter,
        });

        const event: PinchScrollZoomEmitData = {
          x: xCenter,
          y: yCenter,
          originX: 0,
          originY: 0,
          scale: this.currentScale,
          translateX: 0,
          translateY: 0,
        };
        this.onDragging(event);
      });
    },
    submitSize(): void {
      const data = this.$refs.zoomer.getEmitData();
      const event: PinchScrollZoomEmitData = {
        x: data.translateX,
        y: data.translateY,
        originX: data.originX,
        originY: data.originY,
        scale: data.scale,
        translateX: 0,
        translateY: 0,
      };
      this.onDragging(event);
    },
    submitScale(): void {
      this.currentScale = this.scale;
      const data = this.$refs.zoomer.getEmitData();
      this.$refs.zoomer.setData({
        scale: this.scale,
        originX: data.originX,
        originY: data.originY,
        translateX: data.translateX,
        translateY: data.translateY,
      });
    },
    getXcenter(): number {
      const scale = this.currentScale;
      const xfactor = this.xfactor;

      const middle = (this.xRange[0] + this.xRange[1]) / 2;
      const x = Math.floor(middle);
      const odd = middle % 1 === 0 ? 0 : 1;
      const center =
        ((xfactor * odd - this.contentWidth) * scale + this.width) / 2;

      const shift = xfactor * scale * (this.center[0] - x);
      return center - shift;
    },
    getYcenter(): number {
      const yfactor = this.yfactor;
      const scale = this.currentScale;

      const center = ((yfactor - this.contentHeight) * scale + this.height) / 2;
      const middle = (this.yRange[0] + this.yRange[1]) / 2;
      const y = Math.floor(middle);

      const odd = this.center[0] % 2 == 0 ? 0 : 0.5;
      const odd_ = middle % 1 === 0 ? 0 : 0.5;
      const shift = 2 * yfactor * (this.center[1] - y - odd_ + odd) * scale;
      return center - shift;
    },
    getXposition(col: number): number {
      const nx = col * this.xfactor;
      const cnx = nx + this.contentWidth / 2;
      return cnx;
    },
    getYposition(col: number, row: number): number {
      const fy = col % 2 == 0 ? 0 : 0.5;
      const ny = (row + fy) * this.yfactor * 2;
      const cny = ny + this.contentHeight / 2;
      return cny;
    },
    getPositionStyles(col: number, row: number): any {
      const x = this.getXposition(col);
      const y = this.getYposition(col, row);

      return {
        top: `${y}px`,
        left: `${x}px`,
      };
    },
  },
});
</script>

<style lang="scss">
.map-hexagon {
  &__item {
    position: absolute !important;
    transform: translate(-50%, -50%);
  }
}
</style>
