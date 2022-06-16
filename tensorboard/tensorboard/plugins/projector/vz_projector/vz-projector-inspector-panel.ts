/* Copyright 2016 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
import { PolymerElement } from '@polymer/polymer';
import { customElement, observe, property } from '@polymer/decorators';

import { LegacyElementMixin } from '../../../components/polymer/legacy_element_mixin';
import '../../../components/polymer/irons_and_papers';

import { DistanceFunction, SpriteAndMetadataInfo, State, DataSet } from './data';
import { template } from './vz-projector-inspector-panel.html';
import './vz-projector-input';
import { dist2color, normalizeDist } from './projectorScatterPlotAdapter';
import { ProjectorEventContext } from './projectorEventContext';
import { ScatterPlot, MouseMode } from './scatterPlot';


import { ProjectorScatterPlotAdapter } from './projectorScatterPlotAdapter';

import * as knn from './knn';
import * as vector from './vector';
import * as util from './util';
import * as logging from './logging';

const LIMIT_RESULTS = 10000;
const DEFAULT_NEIGHBORS = 100;

type SpriteMetadata = {
  imagePath?: string;
  singleImageDim?: number[];
  aspectRatio?: number;
  nCols?: number;
};

@customElement('vz-projector-inspector-panel')
class InspectorPanel extends LegacyElementMixin(PolymerElement) {
  static readonly template = template;

  dataSet: DataSet;

  @property({ type: String })
  selectedStratergy: string;

  @property({ type: Number })
  budget: number

  @property({ type: String })
  selectedMetadataField: string;

  @property({ type: Array })
  metadataFields: Array<string>;

  @property({ type: String })
  metadataColumn: string;

  @property({ type: Number })
  numNN: number = DEFAULT_NEIGHBORS;

  @property({ type: Object })
  spriteMeta: SpriteMetadata;

  @property({ type: Boolean })
  showNeighborImages: boolean = true;

  @property({ type: Number })
  confidenceThresholdFrom: number

  @property({ type: Number })
  confidenceThresholdTo: number

  @property({ type: Boolean })
  hiddenLabeled: false

  @property({ type: Boolean })
  hiddenTesting: false

  @property({ type: Number })
  epochFrom: number

  @property({ type: Number })
  epochTo: number

  @property({ type: Boolean })
  showTrace: false

  @property({ type: Number })
  currentPlayedEpoch: number

  @property({ type: Boolean })
  spriteImagesAvailable: Boolean = true;

  @property({ type: Boolean })
  noShow: Boolean = false;

  @property({ type: Boolean })
  isCollapsed: boolean = false;

  @property({ type: String })
  collapseIcon: string = 'expand-less';

  @property({ type: Boolean })
  showlabeled: boolean = true;

  @property({ type: Boolean })
  showUnlabeled: boolean = true;

  @property({ type: Boolean })
  showTesting: boolean = true;

  distFunc: DistanceFunction;

  public scatterPlot: ScatterPlot;
  private projectorEventContext: ProjectorEventContext;
  private projectionsPanel: any;
  private displayContexts: string[];
  private projector: any; // Projector; type omitted b/c LegacyElement
  private selectedPointIndices: number[];
  private neighborsOfFirstPoint: knn.NearestEntry[];
  private searchBox: any; // ProjectorInput; type omitted b/c LegacyElement

  private queryByStrategtBtn: HTMLButtonElement;
  private queryByCustom: HTMLButtonElement;
  private boundingSelectionBtn: HTMLButtonElement;
  private isAlSelecting: boolean;
  private trainBySelBtn: HTMLButtonElement;

  private resetFilterButton: HTMLButtonElement;
  private setFilterButton: HTMLButtonElement;
  private clearSelectionButton: HTMLButtonElement;
  private searchButton: HTMLButtonElement;
  private addButton: HTMLButtonElement;
  private resetButton: HTMLButtonElement;
  private sentButton: HTMLButtonElement;
  private showButton: HTMLButtonElement;
  private selectinMessage: HTMLElement;

  private noisyBtn: HTMLButtonElement;
  private stopBtn: HTMLButtonElement;
  private scatterPlotContainer: HTMLElement;

  private limitMessage: HTMLDivElement;
  private _currentNeighbors: any;
  // save current predicates
  private currentPredicate: { [key: string]: any }; // dictionary
  private queryIndices: number[];
  private searchPredicate: string;
  private searchInRegexMode: boolean;
  private filterIndices: number[];
  private searchFields: string[];
  private statergyList: string[];
  private boundingBoxSelection: number[];
  private currentBoundingBoxSelection: number[];
  private projectorScatterPlotAdapter: ProjectorScatterPlotAdapter;


  private currentFilterType: string

  ready() {
    super.ready();

    this.isAlSelecting = false

    this.currentFilterType = 'normal'

    this.queryByStrategtBtn = this.$$('.query-by-stratergy') as HTMLButtonElement;
    this.queryByCustom = this.$$('.query-suggestion') as HTMLButtonElement;
    this.boundingSelectionBtn = this.$$('.bounding-selection') as HTMLButtonElement;

    this.resetFilterButton = this.$$('.reset-filter') as HTMLButtonElement;
    this.setFilterButton = this.$$('.set-filter') as HTMLButtonElement;
    this.clearSelectionButton = this.$$(
      '.clear-selection'
    ) as HTMLButtonElement;
    this.noisyBtn = this.$$('.show-noisy-btn') as HTMLButtonElement
    this.stopBtn = this.$$('.stop-animation-btn') as HTMLButtonElement

    this.searchButton = this.$$('.search') as HTMLButtonElement;
    this.addButton = this.$$('.add') as HTMLButtonElement;
    this.resetButton = this.$$('.reset') as HTMLButtonElement;
    this.sentButton = this.$$('.sent') as HTMLButtonElement;
    this.showButton = this.$$('.show') as HTMLButtonElement;
    // this.selectinMessage = this.$$('.boundingBoxSelection') as HTMLElement;
    this.trainBySelBtn = this.$$('.train-by-selection') as HTMLButtonElement
    this.projectionsPanel = this.$['projections-panel'] as any; // ProjectionsPanel


    this.limitMessage = this.$$('.limit-msg') as HTMLDivElement;
    this.searchBox = this.$$('#search-box') as any; // ProjectorInput
    this.displayContexts = [];
    // show noisy points

    this.currentPredicate = {};
    this.queryIndices = [];
    this.filterIndices = [];
    this.boundingBoxSelection = [];
    this.currentBoundingBoxSelection = [];
    // this.selectinMessage.innerText = "0 seleted.";
    this.confidenceThresholdFrom = 0
    this.confidenceThresholdTo = 1
    this.epochFrom = 1
    this.epochTo = 1
    this.showTrace = false
    this.hiddenLabeled = false
    this.hiddenTesting = false

    this.showlabeled = true
    this.showUnlabeled = true
    this.showTesting = true

    this.budget = 1000
  }
  initialize(projector: any, projectorEventContext: ProjectorEventContext) {
    this.projector = projector;
    this.projectorEventContext = projectorEventContext;
    this.setupUI(projector);
    projectorEventContext.registerSelectionChangedListener(
      (selection, neighbors) => this.updateInspectorPane(selection, neighbors)
    );
    // TODO change them based on metadata fields
    this.searchFields = ["type", "label", "new_selection"]
    this.statergyList = ["random", "coreset", 'bayesianLeastConfidence', "LeastConfidence"]
    // TODO read real points length from dataSet
    for (let i = 0; i < 60000; i++) {
      this.filterIndices.push(i);
    }
  }
  /** Updates the nearest neighbors list in the inspector. */
  private updateInspectorPane(
    indices: number[],
    neighbors: knn.NearestEntry[]
  ) {
    this.neighborsOfFirstPoint = neighbors;
    this.selectedPointIndices = indices;
    // this.updateFilterButtons(indices.length + neighbors.length);
    this.updateFilterButtons(indices.length);
    this.updateNeighborsList(neighbors);
    if (neighbors.length === 0) {
      this.updateSearchResults(indices);
    } else {
      this.updateSearchResults([]);
    }
  }
  private enableResetFilterButton(enabled: boolean) {
    this.resetFilterButton.disabled = !enabled;
  }

  /** Handles toggle of metadata-container. */
  _toggleMetadataContainer() {
    (this.$$('#metadata-container') as any).toggle();
    this.isCollapsed = !this.isCollapsed;
    this.set('collapseIcon', this.isCollapsed ? 'expand-more' : 'expand-less');
  }

  restoreUIFromBookmark(bookmark: State) {
    this.enableResetFilterButton(bookmark.filteredPoints != null);
  }
  metadataChanged(spriteAndMetadata: SpriteAndMetadataInfo) {
    let labelIndex = -1;
    this.metadataFields = spriteAndMetadata.stats.map((stats, i) => {
      if (!stats.isNumeric && labelIndex === -1) {
        labelIndex = i;
      }
      return stats.name;
    });
    if (
      spriteAndMetadata.spriteMetadata &&
      spriteAndMetadata.spriteMetadata.imagePath
    ) {
      const [
        spriteWidth,
        spriteHeight,
      ] = spriteAndMetadata.spriteMetadata.singleImageDim;
      this.spriteMeta = {
        imagePath: spriteAndMetadata.spriteImage?.src,
        aspectRatio: spriteWidth / spriteHeight,
        nCols: Math.floor(spriteAndMetadata.spriteImage?.width / spriteWidth),
        singleImageDim: [spriteWidth, spriteHeight],
      };
    } else {
      this.spriteMeta = {};
    }
    this.spriteImagesAvailable = !!this.spriteMeta.imagePath;
    if (
      this.selectedMetadataField == null ||
      this.metadataFields.filter((name) => name === this.selectedMetadataField)
        .length === 0
    ) {
      // Make the default label the first non-numeric column.
      this.selectedMetadataField = this.metadataFields[Math.max(0, labelIndex)];
    }
    this.updateInspectorPane(
      this.selectedPointIndices,
      this.neighborsOfFirstPoint
    );
  }
  datasetChanged() {
    this.enableResetFilterButton(false);
  }

  @observe('showNeighborImages', 'spriteImagesAvailable')
  _refreshNeighborsList() {
    this.updateNeighborsList();
  }

  @observe('hiddenLabeled')
  _refreshClassiftPoints() {
    this.update()
  }

  @observe('hiddenTesting')
  _refreshTestPoints() {
    this.update()
  }

  @observe('showlabeled')
  _labeledChanged() {
    let indicates = []
    if (window.nowShowIndicates) {
      if (this.showlabeled) {
        for (let i = 0; i < window.properties[window.iteration].length; i++) {
          let indicate = window.properties[window.iteration][i]
          if (indicate === 0 || window.nowShowIndicates.indexOf(i) !== -1) {
            indicates.push(i)
          }
        } 
        window.nowShowIndicates = indicates
        // this.projector.filterDataset(window.nowShowIndicates)
      } else {
        ///隐藏labeled
        for (let i = 0; i < window.properties[window.iteration].length; i++) {
          if (window.properties[window.iteration][i] !== 0 && window.nowShowIndicates.indexOf(i) !== -1) {
            indicates.push(i)
          }
        } 
        window.nowShowIndicates = indicates
      }
      this.projector.filterDataset(window.nowShowIndicates)
    }
  }

  @observe('showUnlabeled')
  _unLabelChanged() {
    let indicates = []
    if (window.nowShowIndicates) {
      console.log('显示unlabeled')
      if (this.showUnlabeled) {
        for (let i = 0; i < window.properties[window.iteration].length; i++) {
          let indicate = window.properties[window.iteration][i]
          if (indicate === 1 || window.nowShowIndicates.indexOf(i) !== -1) {
            indicates.push(i)
          }
        } 
        window.nowShowIndicates = indicates
        // this.projector.filterDataset(window.nowShowIndicates)
      } else {
        ///隐藏unlabeled
        console.log('隐藏unlabelded')
        for (let i = 0; i < window.properties[window.iteration].length; i++) {
          if (window.properties[window.iteration][i] !== 1 && window.nowShowIndicates.indexOf(i) !== -1) {
            indicates.push(i)
          }
        } 
        window.nowShowIndicates = indicates
        console.log('iii',indicates)
      }
      this.projector.filterDataset(window.nowShowIndicates)
    }
  }

  @observe('showTesting')
  _testingChanged() {
    let indicates = []
    if (window.nowShowIndicates) {
      if (this.showTesting) {
        for (let i = 0; i < window.properties[window.iteration].length; i++) {
          let indicate = window.properties[window.iteration][i]
          if (indicate === 2 || window.nowShowIndicates.indexOf(i) !== -1) {
            indicates.push(i)
          }
        } 
        window.nowShowIndicates = indicates
        // this.projector.filterDataset(window.nowShowIndicates)
      } else {
        ///隐藏labeled
        for (let i = 0; i < window.properties[window.iteration].length; i++) {
          if (window.properties[window.iteration][i] !== 2 && window.nowShowIndicates.indexOf(i) !== -1) {
            indicates.push(i)
          }
        } 
        window.nowShowIndicates = indicates
      }
      this.projector.filterDataset(window.nowShowIndicates)
    }
  }

  update() {
    let indicates = []
    if (this.hiddenLabeled && this.hiddenTesting) {
      if (window.properties) {
        if (window.properties[window.iteration].length) {
          for (let i = 0; i < window.properties[window.iteration].length; ++i) {
            if (window.properties[window.iteration][i] === 0) {
              indicates.push(i)
            }
          }
        }
      }
      console.log('indicates', indicates)
      this.projector.filterDataset(indicates)
    } else if (!this.hiddenLabeled && this.hiddenTesting) {
      if (window.properties) {
        if (window.properties[window.iteration].length) {
          for (let i = 0; i < window.properties[window.iteration].length; ++i) {
            if (window.properties[window.iteration][i] !== 2) {
              indicates.push(i)
            }
          }
        }
      }
      console.log('indicates', indicates)
      this.projector.filterDataset(indicates)
    } else if (this.hiddenLabeled && !this.hiddenTesting) {
      if (window.properties) {
        if (window.properties[window.iteration].length) {
          for (let i = 0; i < window.properties[window.iteration].length; ++i) {
            if (window.properties[window.iteration][i] !== 0) {
              indicates.push(i)
            }
          }
        }
      }
      console.log('indicates', indicates)
      this.projector.filterDataset(indicates)
    } else {
      for (let i = 0; i < 60000; ++i) {
        indicates.push(i)
      }
      this.projector?.filterDataset(indicates)
    }
  }

  @observe('showTrace')
  _refreshScatterplot() {
    if (this.showTrace) {
      this.projectorEventContext?.renderInTraceLine(true, this.epochFrom, this.epochTo)
    } else {
      this.projectorEventContext?.renderInTraceLine(false, this.epochFrom, this.epochTo)
    }
  }

  metadataEditorContext(enabled: boolean, metadataColumn: string) {
    if (!this.projector || !this.projector.dataSet) {
      return;
    }
    let stat = this.projector.dataSet.spriteAndMetadataInfo.stats.filter(
      (s) => s.name === metadataColumn
    );
    if (!enabled || stat.length === 0 || stat[0].tooManyUniqueValues) {
      this.removeContext('.metadata-info');
      return;
    }
    this.metadataColumn = metadataColumn;
    this.addContext('.metadata-info');
    let list = this.$$('.metadata-list') as HTMLDivElement;
    list.textContent = '';
    let entries = stat[0].uniqueEntries.sort((a, b) => a.count - b.count);
    let maxCount = entries[entries.length - 1].count;
    entries.forEach((e) => {
      const metadataElement = document.createElement('div');
      metadataElement.className = 'metadata';
      const metadataElementLink = document.createElement('a');
      metadataElementLink.className = 'metadata-link';
      metadataElementLink.title = e.label;
      const labelValueElement = document.createElement('div');
      labelValueElement.className = 'label-and-value';
      const labelElement = document.createElement('div');
      labelElement.className = 'label';
      labelElement.style.color = dist2color(this.distFunc, maxCount, e.count);
      labelElement.innerText = e.label;
      const valueElement = document.createElement('div');
      valueElement.className = 'value';
      valueElement.innerText = e.count.toString();
      labelValueElement.appendChild(labelElement);
      labelValueElement.appendChild(valueElement);
      const barElement = document.createElement('div');
      barElement.className = 'bar';
      const barFillElement = document.createElement('div');
      barFillElement.className = 'fill';
      barFillElement.style.borderTopColor = dist2color(
        this.distFunc,
        maxCount,
        e.count
      );
      barFillElement.style.width =
        normalizeDist(this.distFunc, maxCount, e.count) * 100 + '%';
      barElement.appendChild(barFillElement);
      for (let j = 1; j < 4; j++) {
        const tickElement = document.createElement('div');
        tickElement.className = 'tick';
        tickElement.style.left = (j * 100) / 4 + '%';
        barElement.appendChild(tickElement);
      }
      metadataElementLink.appendChild(labelValueElement);
      metadataElementLink.appendChild(barElement);
      metadataElement.appendChild(metadataElementLink);
      list.appendChild(metadataElement);
      metadataElementLink.onclick = () => {
        this.projector.metadataEdit(metadataColumn, e.label);
      };
    });
  }

  private addContext(context: string) {
    if (this.displayContexts.indexOf(context) === -1) {
      this.displayContexts.push(context);
    }
    this.displayContexts.forEach((c) => {
      (this.$$(c) as HTMLDivElement).style.display = 'none';
    });
    (this.$$(context) as HTMLDivElement).style.display = null;
  }
  private removeContext(context: string) {
    this.displayContexts = this.displayContexts.filter((c) => c !== context);
    (this.$$(context) as HTMLDivElement).style.display = 'none';
    if (this.displayContexts.length > 0) {
      let lastContext = this.displayContexts[this.displayContexts.length - 1];
      (this.$$(lastContext) as HTMLDivElement).style.display = null;
    }
  }
  private async updateSearchResults(indices: number[]) {
    const container = this.$$('.matches-list') as HTMLDivElement;
    const list = container.querySelector('.list') as HTMLDivElement;
    list.textContent = '';
    if (indices.length === 0) {
      this.removeContext('.matches-list');
      return;
    }
    this.addContext('.matches-list');
    this.limitMessage.style.display =
      indices.length <= LIMIT_RESULTS ? 'none' : null;
    indices = indices.slice(0, LIMIT_RESULTS);
    // const msgId = logging.setModalMessage('Fetching sprite image...');

    let DVIServer = '';
    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    await fetch("standalone_projector_config.json", { method: 'GET' })
      .then(response => response.json())
      .then(data => { DVIServer = data.DVIServerIP + ":" + data.DVIServerPort; })
    window.recommendIndices = []
    window.checkboxDom = []
    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];
      const row = document.createElement('div');
      row.className = 'row';
      const label = this.getLabelFromIndex(index);
      const rowLink = document.createElement('a');
      rowLink.className = 'label';
      rowLink.title = label;
      rowLink.innerText = label;
      rowLink.onmouseenter = () => {
        this.projectorEventContext.notifyHoverOverPoint(index);
      };
      rowLink.onmouseleave = () => {
        this.projectorEventContext.notifyHoverOverPoint(null);
      };
      // rowLink.onclick = () => {
      //   this.projectorEventContext.notifySelectionChanged([index]);
      // };



      await fetch(`http://${DVIServer}/sprite?index=${indices[i]}&path=${'/Users/zhangyifan/Downloads/toy_model/resnet18_cifar10'}`, {
        method: 'GET',
        mode: 'cors'
      }).then(response => response.json()).then(data => {
        console.log("response", data);
        let img = document.createElement('img');
        let input = document.createElement('input');
        input.type = 'checkbox'
        input.setAttribute('id', `resCheckbox${indices[i]}`)
        img.src = 'data:image/png;base64,' + data.imgUrl;
        rowLink.onmouseenter = () => {
          this.projectorEventContext.updateMetaDataByIndices(indices[i], img.src)
          this.projectorEventContext.notifyHoverOverPoint(index);
        };
        rowLink.onmouseleave = () => {
          this.projectorEventContext.updateMetaDataByIndices(-1, '')
          this.projectorEventContext.notifyHoverOverPoint(null);
        };
        if (!window.checkboxDom) {
          window.checkboxDom = []
        }
        window.checkboxDom[indices[i]] = input
        input.addEventListener('change', (e) => {
          console.log('e', indices[i], e, input.checked)
          if (!window.customSelection) {
            window.customSelection = []
          }
          if (input.checked) {
            window.customSelection.push(indices[i])
            this.projectorEventContext.refresh()
          } else {
            let index = window.customSelection.indexOf(indices[i])
            window.customSelection.splice(index, 1)
            this.projectorEventContext.refresh()
          }
          this.projectorEventContext.notifyHoverOverPoint(indices[i]);
        })
        row.appendChild(input);
        row.appendChild(img);
        // logging.setModalMessage(null, msgId);
      }).catch(error => {
        console.log("error", error);
      });


      row.className = 'row-img';


      row.appendChild(rowLink);
      list.appendChild(row);
    }
  }
  private getLabelFromIndex(pointIndex: number): string {
    const metadata = this.projector.dataSet.points[pointIndex].metadata[
      this.selectedMetadataField
    ];
    let prediction = this.projector.dataSet.points[pointIndex].current_prediction;
    if (prediction == undefined) {
      prediction = `Unknown`;
    }

    let original_label = this.projector.dataSet.points[pointIndex].original_label;
    if (original_label == undefined) {
      original_label = `Unknown`;
    }

    const stringMetaData = metadata !== undefined ? String(metadata) : `Unknown #${pointIndex}`;
    return String(pointIndex) + "Label: " + stringMetaData + " Prediction: " + prediction + " Original label: " + original_label;
  }
  private spriteImageRenderer() {
    const spriteImagePath = this.spriteMeta.imagePath;
    const { aspectRatio, nCols } = this.spriteMeta as any;
    const paddingBottom = 100 / aspectRatio + '%';
    const backgroundSize = `${nCols * 100}% ${nCols * 100}%`;
    const backgroundImage = `url(${CSS.escape(spriteImagePath)})`;
    return (neighbor: knn.NearestEntry): HTMLElement => {
      const spriteElementImage = document.createElement('div');
      spriteElementImage.className = 'sprite-image';
      spriteElementImage.style.backgroundImage = backgroundImage;
      spriteElementImage.style.paddingBottom = paddingBottom;
      spriteElementImage.style.backgroundSize = backgroundSize;
      const [row, col] = [
        Math.floor(neighbor.index / nCols),
        neighbor.index % nCols,
      ];
      const [top, left] = [
        (row / (nCols - 1)) * 100,
        (col / (nCols - 1)) * 100,
      ];
      spriteElementImage.style.backgroundPosition = `${left}% ${top}%`;
      return spriteElementImage;
    };
  }
  updateCurrentPlayEpoch(num: number) {
    this.currentPlayedEpoch = num
  }
  private updateNeighborsList(neighbors?: knn.NearestEntry[]) {
    neighbors = neighbors || this._currentNeighbors;
    this._currentNeighbors = neighbors;
    if (neighbors == null) {
      return;
    }
    const nnlist = this.$$('.nn-list') as HTMLDivElement;
    nnlist.textContent = '';
    if (neighbors.length === 0) {
      this.removeContext('.nn');
      return;
    }
    this.addContext('.nn');
    this.searchBox.message = '';
    const minDist = neighbors.length > 0 ? neighbors[0].dist : 0;
    if (this.spriteImagesAvailable && this.showNeighborImages) {
      var imageRenderer = this.spriteImageRenderer();
    }
    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i];
      const neighborElement = document.createElement('div');
      neighborElement.className = 'neighbor';
      const neighborElementLink = document.createElement('a');
      neighborElementLink.className = 'neighbor-link';
      neighborElementLink.title = this.getLabelFromIndex(neighbor.index);
      const labelValueElement = document.createElement('div');
      labelValueElement.className = 'label-and-value';
      const labelElement = document.createElement('div');
      labelElement.className = 'label';
      labelElement.style.color = dist2color(
        this.distFunc,
        neighbor.dist,
        minDist
      );
      labelElement.innerText = this.getLabelFromIndex(neighbor.index);
      const valueElement = document.createElement('div');
      valueElement.className = 'value';
      valueElement.innerText = this.projector.dataSet.points[neighbor.index]?.current_inv_acc?.toFixed(3);
      labelValueElement.appendChild(labelElement);
      labelValueElement.appendChild(valueElement);
      const barElement = document.createElement('div');
      barElement.className = 'bar';
      const barFillElement = document.createElement('div');
      barFillElement.className = 'fill';
      barFillElement.style.borderTopColor = dist2color(
        this.distFunc,
        neighbor.dist,
        minDist
      );
      barFillElement.style.width =
        normalizeDist(this.distFunc, neighbor.dist, minDist) * 100 + '%';
      barElement.appendChild(barFillElement);
      for (let j = 1; j < 4; j++) {
        const tickElement = document.createElement('div');
        tickElement.className = 'tick';
        tickElement.style.left = (j * 100) / 4 + '%';
        barElement.appendChild(tickElement);
      }
      if (this.spriteImagesAvailable && this.showNeighborImages) {
        const neighborElementImage = imageRenderer(neighbor);
        neighborElement.appendChild(neighborElementImage);
      }
      neighborElementLink.appendChild(labelValueElement);
      neighborElementLink.appendChild(barElement);
      neighborElement.appendChild(neighborElementLink);
      nnlist.appendChild(neighborElement);
      neighborElementLink.onmouseenter = () => {
        this.projectorEventContext.notifyHoverOverPoint(neighbor.index);
      };
      neighborElementLink.onmouseleave = () => {
        this.projectorEventContext.notifyHoverOverPoint(null);
      };
      neighborElementLink.onclick = () => {
        this.projectorEventContext.notifySelectionChanged([neighbor.index]);
      };
    }
  }
  private updateFilterButtons(numPoints: number) {
    if (numPoints) {
      this.setFilterButton.innerText = `Filter ${numPoints} points`;
      if (numPoints > 1) {
        this.setFilterButton.disabled = null;
      }
      this.clearSelectionButton.disabled = null;
    } else {
      this.setFilterButton.innerText = `Filter selection`;
      this.setFilterButton.disabled = true;
      this.clearSelectionButton.disabled = true;
    }
  }
  private setupUI(projector: any) {

    const self = this;
    const inkTabs = this.root.querySelectorAll('.ink-tab');
    for (let i = 0; i < inkTabs.length; i++) {
      inkTabs[i].addEventListener('click', function () {
        let id = this.getAttribute('data-tab');
        self.showTab(id);
      });
    }
    self.showTab('normal');

    this.boundingSelectionBtn.onclick = (e: any) => {

      this.isAlSelecting = !this.isAlSelecting
      if (this.isAlSelecting) {
        window.isAdjustingSel = true
        this.boundingSelectionBtn.classList.add('actived')
        this.projectorEventContext.setMouseMode(MouseMode.AREA_SELECT)
        // this.projectorScatterPlotAdapter.scatterPlot.setMouseMode(MouseMode.AREA_SELECT);
      } else {
        window.isAdjustingSel = false
        this.boundingSelectionBtn.classList.remove('actived')
        this.projectorEventContext.setMouseMode(MouseMode.CAMERA_AND_CLICK_SELECT);
      }
    }

    this.queryByStrategtBtn.onclick = () => {
      projector.queryByAL(
        this.projector.iteration,
        this.selectedStratergy,
        Number(this.budget),
        (indices: any) => {
          if (indices != null) {
            this.queryIndices = indices;
            if (this.queryIndices.length == 0) {
              this.searchBox.message = '0 matches.';
            } else {
              this.searchBox.message = `${this.queryIndices.length} matches.`;
            }

            this.projectorEventContext.notifySelectionChanged(this.queryIndices, false, 'isALQuery');
          }
        }
      );
    }

    this.queryByCustom.onclick = () => {
      console.log('90909111')
      if(!window.customSelection){
        window.customSelection = []
      }
      projector.querySuggestion(
        this.projector.iteration,
        window.customSelection,
        200,
        (indices: any) => {
          if (indices != null) {
            this.queryIndices = indices;
            if (this.queryIndices.length == 0) {
              this.searchBox.message = '0 matches.';
            } else {
              this.searchBox.message = `${this.queryIndices.length} matches.`;
            }
            console.log('indices',indices)

            this.projectorEventContext.notifySelectionChanged(this.queryIndices, false, 'isALQuery');
          }
        }
      );
    }

    this.trainBySelBtn.onclick = () => {
      console.log(this.projector.iteration, this.selectedPointIndices)
      this.projector.retrainBySelections(this.projector.iteration, this.selectedPointIndices)
      //  this.projectionsPanel.reTrainBySel(this.projector.iteration,this.selectedPointIndices)
    }
    this.distFunc = vector.cosDist;
    const eucDist = this.$$('.distance a.euclidean') as HTMLLinkElement;
    eucDist.onclick = () => {
      const links = this.root.querySelectorAll('.distance a');
      for (let i = 0; i < links.length; i++) {
        util.classed(links[i] as HTMLElement, 'selected', false);
      }
      util.classed(eucDist as HTMLElement, 'selected', true);
      this.distFunc = vector.dist;
      this.projectorEventContext.notifyDistanceMetricChanged(this.distFunc);
      const neighbors = projector.dataSet.findNeighbors(
        this.selectedPointIndices[0],
        this.distFunc,
        this.numNN
      );
      this.updateNeighborsList(neighbors);
    };
    const cosDist = this.$$('.distance a.cosine') as HTMLLinkElement;
    cosDist.onclick = () => {
      const links = this.root.querySelectorAll('.distance a');
      for (let i = 0; i < links.length; i++) {
        util.classed(links[i] as HTMLElement, 'selected', false);
      }
      util.classed(cosDist, 'selected', true);
      this.distFunc = vector.cosDist;
      this.projectorEventContext.notifyDistanceMetricChanged(this.distFunc);
      const neighbors = projector.dataSet.findNeighbors(
        this.selectedPointIndices[0],
        this.distFunc,
        this.numNN
      );
      this.updateNeighborsList(neighbors);
    };

    // Called whenever the search text input changes.
    // const updateInput = (value: string, inRegexMode: boolean) => {
    //   if (value == null || value.trim() === '') {
    //     this.searchBox.message = '';
    //     this.projectorEventContext.notifySelectionChanged([]);
    //     return;
    //   }
    //   projector.query(
    //     value,
    //     inRegexMode,
    //     this.selectedMetadataField,
    //     this.currentPredicate,
    //     (currPredicates:{[key:string]: any}, indices:any)=>{
    //       this.currentPredicate = currPredicates;
    //       this.queryIndices = indices;
    //   }
    //   );
    //
    //   if (this.queryIndices.length == 0) {
    //     this.searchBox.message = '0 matches.';
    //   } else {
    //     this.searchBox.message = `${this.queryIndices.length} matches.`;
    //   }
    //   this.projectorEventContext.notifySelectionChanged(this.queryIndices);
    // };
    // this.searchBox.registerInputChangedListener((value, inRegexMode) => {
    //   updateInput(value, inRegexMode);
    // });
    // Filtering dataset.

    this.noisyBtn.onclick = () => {
      window.isAnimatating = true
      console.log(this.epochFrom, this.epochTo)
      this.projectorEventContext.setDynamicNoisy(this.epochFrom, this.epochTo)
      this.noisyBtn.disabled = true;
      this.stopBtn.disabled = false;
      // if (this.showTrace) {
      //   // this.projectorScatterPlotAdapter.scatterPlot.render()
      //   this.projectorEventContext.renderInTraceLine(true, this.epochFrom, this.epochTo)
      // }
      // } else{
      //   this.projectorEventContext.renderInTraceLine(false, this.epochFrom, this.epochTo)
      // }
    }


    this.stopBtn.onclick = () => {
      window.isAnimatating = false
      this.projectorEventContext.setDynamicStop()
      this.noisyBtn.disabled = false;
      this.stopBtn.disabled = true;
      // this.projectorEventContext.renderInTraceLine(false, 1, 1)
      if (window.lineGeomertryList?.length) {
        for (let i = 0; i < window.lineGeomertryList; i++) { window.lineGeomertryList[i].parent.remove(window.lineGeomertryList[i]) }
      }
    }

    this.setFilterButton.onclick = () => {
      window.isFilter = true
      var indices = this.selectedPointIndices.concat(
        this.neighborsOfFirstPoint.map((n) => n.index)
      );

      this.currentPredicate[this.selectedMetadataField] = this.searchPredicate;
      this.filterIndices = this.selectedPointIndices.sort()
      console.log(indices, this.selectedPointIndices)
      projector.filterDataset(indices, true);
      this.enableResetFilterButton(true);
      this.updateFilterButtons(this.filterIndices.length);
    };
    this.resetFilterButton.onclick = () => {
      window.isFilter = false
      this.queryIndices = [];
      this.currentPredicate = {};
      this.filterIndices = [];
      projector.resetFilterDataset(projector.dataSet.DVICurrentRealDataNumber);
      this.enableResetFilterButton(false);
      this.searchBox.setValue("", false);
    };
    this.clearSelectionButton.onclick = () => {
      window.customSelection = []
      this.projectorEventContext.refresh()
      this.updateFilterButtons(0)
      projector.adjustSelectionAndHover([]);
      this.queryIndices = [];
    };
    this.enableResetFilterButton(false);

    const updateInput = (value: string, inRegexMode: boolean) => {
      this.searchPredicate = value;
      this.searchInRegexMode = inRegexMode
    };
    this.searchBox.registerInputChangedListener((value, inRegexMode) => {
      updateInput(value, inRegexMode);
    });
    this.searchButton.onclick = () => {
      // read search box input and update indices

      if (this.searchPredicate == null || this.searchPredicate.trim() === '') {
        this.searchBox.message = '';
        this.projectorEventContext.notifySelectionChanged([]);
        return;
      }
      console.log(this.searchPredicate, this.selectedMetadataField, this.confidenceThresholdFrom, this.confidenceThresholdTo)
      projector.query(
        this.searchPredicate,
        this.searchInRegexMode,
        this.selectedMetadataField,
        this.currentPredicate,
        this.projector.iteration,
        this.confidenceThresholdFrom,
        this.confidenceThresholdTo,
        (indices: any) => {
          if (indices != null) {
            this.queryIndices = indices;
            if (this.queryIndices.length == 0) {
              this.searchBox.message = '0 matches.';
            } else {
              this.searchBox.message = `${this.queryIndices.length} matches.`;
            }
            // console.log('this.queryIndices',this.queryIndices)
            this.projectorEventContext.notifySelectionChanged(this.queryIndices);
          }
        }
      );
    }
    this.addButton.onclick = () => {
      for (let i = 0; i < this.currentBoundingBoxSelection.length; i++) {
        if (this.boundingBoxSelection.indexOf(this.currentBoundingBoxSelection[i]) < 0) {
          this.boundingBoxSelection.push(this.currentBoundingBoxSelection[i]);
        }
      }
      // this.selectinMessage.innerText = String(this.boundingBoxSelection.length) + " seleted.";
    }
    this.resetButton.onclick = () => {
      this.boundingBoxSelection = [];
      // this.selectinMessage.innerText = "0 seleted.";
    }
    this.sentButton.onclick = () => {
      console.log(this.selectedPointIndices, this.boundingBoxSelection)
      // this.projector.saveDVISelection(this.boundingBoxSelection, (msg: string) => {
      //   this.selectinMessage.innerText = msg;
      //   logging.setWarnMessage(msg, null);
      // });
    }
    this.showButton.onclick = () => {
      this.projectorEventContext.notifySelectionChanged(this.boundingBoxSelection, true);
    }
  }
  public showTab(id: string) {
    this.currentFilterType = id;
    const tab = this.$$('.ink-tab[data-tab="' + id + '"]') as HTMLElement;
    const allTabs = this.root.querySelectorAll('.ink-tab');
    for (let i = 0; i < allTabs.length; i++) {
      util.classed(allTabs[i] as HTMLElement, 'active', false);
    }
    util.classed(tab, 'active', true);
    const allTabContent = this.root.querySelectorAll('.ink-panel-content');
    for (let i = 0; i < allTabContent.length; i++) {
      util.classed(allTabContent[i] as HTMLElement, 'active', false);
    }
    util.classed(
      this.$$('.ink-panel-content[data-panel="' + id + '"]') as HTMLElement,
      'active',
      true
    );
    // guard for unit tests, where polymer isn't attached and $ doesn't exist.
    if (this.$ != null) {
      const main = this.$['main'];
      // In order for the projections panel to animate its height, we need to
      // set it explicitly.
      requestAnimationFrame(() => {
        this.style.height = main?.clientHeight + 'px';
      });
    }
    console.log(id);
  }
  updateBoundingBoxSelection(indices: number[]) {
    this.currentBoundingBoxSelection = indices;
    if (!window.customSelection) {
      window.customSelection = []
    }
    for (let i = 0; i < this.currentBoundingBoxSelection.length; i++) {
      if (window.customSelection.indexOf(this.currentBoundingBoxSelection[i]) < 0) {
        window.customSelection.push(this.currentBoundingBoxSelection[i]);
      } else {
        let index = window.customSelection.indexOf(this.currentBoundingBoxSelection[i])
        window.customSelection.splice(index, 1)
      }
    }
    console.log('bobob', this.boundingBoxSelection, window.customSelection)
    // window.customSelection = this.currentBoundingBoxSelection
  }
  private updateNumNN() {
    if (this.selectedPointIndices != null) {
      this.projectorEventContext.notifySelectionChanged([
        this.selectedPointIndices[0],
      ]);
    }
  }
}
