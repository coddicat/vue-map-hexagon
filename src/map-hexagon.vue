<template>
  <PinchScrollZoom
    ref="zoomer"
    :width="width"
    :height="height"
    :within="within"
    :content-width="contentWidth"
    :content-height="contentHeight"
    :throttle-delay="scrollZoomThrottleDelay"
    @scaling="onScaling"
    @dragging="onDragging"
    :scale="scale"
    :min-scale="_minScale"
    :max-scale="_maxScale"
    :draggable="draggable"
  >
    <div class="map-hexagon" :style="mapStyles">
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
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

import { HexagonCell, HexagonCellData } from "./types";
import PinchScrollZoom, { PinchScrollZoomEmitData } from "@coddicat/vue-pinch-scroll-zoom";
import Hexagon from "@coddicat/vue-hexagon";
import { throttle, DebouncedFunc } from "lodash";

const angle = (Math.PI / 180) * 60;

@Component({
  name: "MapHexagon",
  components: {
    PinchScrollZoom,
    Hexagon,
  },
})
export default class MapHexagon extends Vue {
  @Prop({ required: false, default: undefined }) private cells: HexagonCell[] | undefined;
  @Prop({ required: false, default: 400 }) private width!: number;
  @Prop({ required: false, default: 400 }) private height!: number;
  @Prop({
    required: false,
    default(): number[] {
      const that = this as MapHexagon;
      if (!that.cells) {
        return [-5, 5];
      }
      const arr = that.cells.map((x: HexagonCell) => x.col);
      const min = Math.min.apply(null, arr);
      const max = Math.max.apply(null, arr);

      return [min, max];
    },
  })
  private xRange!: number[];

  @Prop({
    required: false,
    default(): number[] {
      const that = this as MapHexagon;
      if (!that.cells) {
        return [-5, 5];
      }
      const arr = that.cells.map(x => x.row);
      const min = Math.min.apply(null, arr);
      const max = Math.max.apply(null, arr);

      return [min, max];
    },
  })
  private yRange!: number[];

  @Prop({ required: false, default: 100 }) private itemSize!: number;
  @Prop({ required: false, default: 5 }) private itemsGap!: number;
  @Prop({ required: false, default: false }) private within!: boolean;
  @Prop({ required: false, default: true }) private zoom!: boolean;
  @Prop({ required: false, default: 0.6 }) private minScale!: number;
  @Prop({ required: false, default: 3 }) private maxScale!: number;

  @Prop({
    required: false,
    default(): number[] {
      const that = this as MapHexagon;
      const xRange = that.xRange as Array<number>;
      const yRange = that.yRange as Array<number>;

      const x = Math.floor((xRange[0] + xRange[1]) / 2);
      const y = Math.floor((yRange[0] + yRange[1]) / 2);
      return [x, y];
    },
  })
  private center!: number[];

  @Prop({ required: false, default: 1 }) private scale!: number;
  @Prop({ required: false, default: true }) private autoCenter!: boolean;
  @Prop({ required: false, default: true }) private draggable!: boolean;
  @Prop({ required: false, default: 40 }) private scrollZoomThrottleDelay!: number;
  @Prop({ required: false, default: 200 }) private renderThrottleDelay!: number;

  private currentScale: number = this.scale;
  private visibleLeft: number = 0;
  private visibleTop: number = 0;
  private visibleRight: number = 0;
  private visibleBottom: number = 0;
  private draggingListener: boolean = false;
  private scalingListener: boolean = false;
  private setVisibles: DebouncedFunc<any> = throttle(this.doSetVisibles, this.renderThrottleDelay);


  mounted(): void {
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
  }

  @Watch("center")
  centerChanged() {
    if (this.autoCenter) {
      this.submitCenter();
    }
  }
  
  @Watch("height")
  heightChanged() {
    this.submitSize();
  }

  @Watch("height")
  widthChanged() {
    this.submitSize();
  }

  get mapStyles(): object {
    return { transform: `translate(${-this.xOffset}px, ${-this.yOffset}px)` };
  }
  get radius(): number {
    return this.itemSize / 2 + this.itemsGap;
  }
  get xfactor(): number {
    return this.radius * Math.cos(angle) + this.radius;
  }
  get yfactor(): number {
    return this.radius * Math.sin(angle);
  }
  get xOffset(): number {
    const cnx = this.getXposition(this.xRange[0]);
    return cnx - this.radius;
  }
  get contentWidth(): number {
    const res =
      (this.xRange[1] - this.xRange[0] + 1) * this.xfactor + this.radius / 2;
    return res;
  }
  get yOffset(): number {
    const cny = this.getYposition(0, this.yRange[0]);
    return cny - this.yfactor;
  }
  get contentHeight(): number {
    const res =
      (this.yRange[1] - this.yRange[0] + 1) * this.yfactor * 2 + this.yfactor;
    return res;
  }
  get _cells(): Array<HexagonCell | HexagonCellData> {
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
  }
  get _minScale(): number {
    return this.zoom ? this.minScale : this.maxScale;
  }
  get _maxScale(): number {
    return this.zoom ? this.maxScale : this.minScale;
  }

  public onDragging(event: PinchScrollZoomEmitData): void {
    const scale = event.scale;
    const originX = event.originX;
    const originY = event.originY;

    const scaleFactorX = scale * this.xfactor;
    const floatLeft = (originX * scale - event.x - originX) / scaleFactorX;
    const floatRight = floatLeft + this.width / scaleFactorX;

    const scaleFactorY = scale * this.yfactor * 2;
    const floatTop = (originY * scale - event.y - originY) / scaleFactorY;
    const floatBottom = floatTop + this.height / scaleFactorY;

    if (this.draggingListener) {
      this.$emit("dragging", event);
    }

    this.setVisibles(floatLeft, floatRight, floatTop, floatBottom);
  }
  public doSetVisibles(
    floatLeft: number,
    floatRight: number,
    floatTop: number,
    floatBottom: number
  ) {
    this.visibleLeft = Math.floor(floatLeft) + this.xRange[0] - 1;
    this.visibleRight = Math.floor(floatRight) + this.xRange[0];
    this.visibleTop = Math.floor(floatTop) + this.yRange[0] - 1;
    this.visibleBottom = Math.floor(floatBottom) + this.yRange[0];
  }
  public onScaling(event: PinchScrollZoomEmitData): void {
    this.onDragging(event);
    this.currentScale = event.scale;
    if (this.scalingListener) {
      this.$emit("scaling", event);
    }
  }
  public submitCenter(): void {
    this.$nextTick(() => {
      const xCenter = this.getXcenter();
      const yCenter = this.getYcenter();
      const zoomer = this.$refs.zoomer as PinchScrollZoom;
      zoomer.setData({
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
  }
  public submitSize(): void {
    const zoomer = this.$refs.zoomer as PinchScrollZoom;
    const data = zoomer.getEmitData();
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
  }
  public submitScale(): void {
    this.currentScale = this.scale;
    const zoomer = this.$refs.zoomer as PinchScrollZoom;
    const data = zoomer.getEmitData();
    zoomer.setData({
      scale: this.scale,
      originX: data.originX,
      originY: data.originY,
      translateX: data.translateX,
      translateY: data.translateY,
    });
  }
  public getXcenter(): number {
    const scale = this.currentScale;
    const xfactor = this.xfactor;

    const middle = (this.xRange[0] + this.xRange[1]) / 2;
    const x = Math.floor(middle);
    const odd = middle % 1 === 0 ? 0 : 1;
    const center =
      ((xfactor * odd - this.contentWidth) * scale + this.width) / 2;

    const shift = xfactor * scale * (this.center[0] - x);
    return center - shift;
  }
  public getYcenter(): number {
    const yfactor = this.yfactor;
    const scale = this.currentScale;

    const center = ((yfactor - this.contentHeight) * scale + this.height) / 2;
    const middle = (this.yRange[0] + this.yRange[1]) / 2;
    const y = Math.floor(middle);

    const odd = this.center[0] % 2 == 0 ? 0 : 0.5;
    const odd_ = middle % 1 === 0 ? 0 : 0.5;
    const shift = 2 * yfactor * (this.center[1] - y - odd_ + odd) * scale;
    return center - shift;
  }
  public getXposition(col: number): number {
    const nx = col * this.xfactor;
    const cnx = nx + this.contentWidth / 2;
    return cnx;
  }
  public getYposition(col: number, row: number): number {
    const fy = col % 2 == 0 ? 0 : 0.5;
    const ny = (row + fy) * this.yfactor * 2;
    const cny = ny + this.contentHeight / 2;
    return cny;
  }
  public getPositionStyles(col: number, row: number): object {
    const x = this.getXposition(col);
    const y = this.getYposition(col, row);

    return {
      top: `${y}px`,
      left: `${x}px`,
    };
  }
}
</script>

<style lang="scss">
.map-hexagon {
  &__item {
    position: absolute !important;
    transform: translate(-50%, -50%);
  }
}
</style>
