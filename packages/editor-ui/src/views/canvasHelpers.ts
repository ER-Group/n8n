import { getStyleTokenValue } from "@/components/helpers";
import { START_NODE_TYPE } from "@/constants";
import { IBounds, INodeUi, IZoomConfig, XYPosition } from "@/Interface";
import { Connection, Endpoint, Overlay, OverlaySpec, PaintStyle } from "jsplumb";
import {
	IConnection,
	ITaskData,
	INodeExecutionData,
	NodeInputConnections,
} from 'n8n-workflow';

export const OVERLAY_DROP_NODE_ID = 'drop-add-node';
export const OVERLAY_MIDPOINT_ARROW_ID = 'midpoint-arrow';
export const OVERLAY_ENDPOINT_ARROW_ID = 'endpoint-arrow';
export const OVERLAY_RUN_ITEMS_ID = 'output-items-label';
export const OVERLAY_CONNECTION_ACTIONS_ID = 'connection-actions';
export const JSPLUMB_FLOWCHART_STUB = 26;
export const OVERLAY_INPUT_NAME_LABEL = 'input-name-label';
export const OVERLAY_INPUT_NAME_LABEL_POSITION = [-3, .5];
export const OVERLAY_INPUT_NAME_LABEL_POSITION_MOVED = [-4.5, .5];
export const OVERLAY_OUTPUT_NAME_LABEL = 'output-name-label';

const MIN_X_TO_SHOW_OUTPUT_LABEL = 90;
const MIN_Y_TO_SHOW_OUTPUT_LABEL = 100;

export const NODE_SIZE = 100;
export const DEFAULT_START_POSITION_X = 240;
export const DEFAULT_START_POSITION_Y = 300;
export const HEADER_HEIGHT = 65;
export const SIDEBAR_WIDTH = 65;
export const MAX_X_TO_PUSH_DOWNSTREAM_NODES = 300;
export const PUSH_NODES_OFFSET = 200;

export const DEFAULT_START_NODE = {
	name: 'Start',
	type: START_NODE_TYPE,
	typeVersion: 1,
	position: [
		DEFAULT_START_POSITION_X,
		DEFAULT_START_POSITION_Y,
	] as XYPosition,
	parameters: {},
};

export const CONNECTOR_FLOWCHART_TYPE = ['N8nFlowchart', {
	cornerRadius: 4,
	stub: JSPLUMB_FLOWCHART_STUB + 10,
	gap: 5,
	alwaysRespectStubs: true,
	loopbackVerticalLength: NODE_SIZE, // length of vertical segment when looping
	loopbackMinimum: 140, // minimum length before flowchart loops around
	getEndpointOffset(endpoint: Endpoint) {
		const indexOffset = 10; // stub offset between different endpoints of same node
		const index = endpoint && endpoint.__meta ? endpoint.__meta.index : 0;

		const outputOverlay = endpoint.getOverlay(OVERLAY_OUTPUT_NAME_LABEL);
		const labelOffset = outputOverlay && outputOverlay.label && outputOverlay.label.length > 1 ? 10 : 0;

		return index * indexOffset + labelOffset;
	},
}];

export const CONNECTOR_PAINT_STYLE_DEFAULT: PaintStyle = {
	stroke: getStyleTokenValue('--color-foreground-dark'),
	strokeWidth: 2,
	outlineWidth: 12,
	outlineStroke: 'transparent',
};

export const CONNECTOR_PAINT_STYLE_PRIMARY = {
	...CONNECTOR_PAINT_STYLE_DEFAULT,
	stroke: getStyleTokenValue('--color-primary'),
};

export const CONNECTOR_PAINT_STYLE_SUCCESS = {
	...CONNECTOR_PAINT_STYLE_DEFAULT,
	stroke: getStyleTokenValue('--color-success'),
};

export const CONNECTOR_ARROW_OVERLAYS: OverlaySpec[] = [
	[
		'Arrow',
		{
			id: OVERLAY_ENDPOINT_ARROW_ID,
			location: 1,
			width: 12,
			foldback: 1,
			length: 10,
			visible: true,
		},
	],
	[
		'Arrow',
		{
			id: OVERLAY_MIDPOINT_ARROW_ID,
			location: 0.5,
			width: 12,
			foldback: 1,
			length: 10,
			visible: false,
		},
	],
];

export const CONNECTOR_DROP_NODE_OVERLAY: OverlaySpec[] = [
	[
		'Label',
		{
			id: OVERLAY_DROP_NODE_ID,
			label: 'Drop connection<br />to create node',
			cssClass: 'drop-add-node-label',
			location: 0.5,
			visible: true,
		},
	],
];

export const addOverlays = (connection: Connection, overlays: OverlaySpec[]) => {
	overlays.forEach((overlay: OverlaySpec) => {
		connection.addOverlay(overlay);
	});
};

export const getLeftmostTopNode = (nodes: INodeUi[]): INodeUi => {
	return nodes.reduce((leftmostTop, node) => {
		if (node.position[0] > leftmostTop.position[0] || node.position[1] > leftmostTop.position[1]) {
			return leftmostTop;
		}

		return node;
	});
};

export const getWorkflowCorners = (nodes: INodeUi[]): IBounds => {
	return nodes.reduce((accu: IBounds, node: INodeUi) => {
		if (node.position[0] < accu.minX) {
			accu.minX = node.position[0];
		}
		if (node.position[1] < accu.minY) {
			accu.minY = node.position[1];
		}
		if (node.position[0] > accu.maxX) {
			accu.maxX = node.position[0];
		}
		if (node.position[1] > accu.maxY) {
			accu.maxY = node.position[1];
		}

		return accu;
	}, {
		minX: nodes[0].position[0],
		minY: nodes[0].position[1],
		maxX: nodes[0].position[0],
		maxY: nodes[0].position[1],
	});
};

export const scaleSmaller = ({scale, offset: [xOffset, yOffset]}: IZoomConfig): IZoomConfig => {
	scale /= 1.25;
	xOffset /= 1.25;
	yOffset /= 1.25;
	xOffset += window.innerWidth / 10;
	yOffset += window.innerHeight / 10;

	return {
		scale,
		offset: [xOffset, yOffset],
	};
};

export const scaleBigger = ({scale, offset: [xOffset, yOffset]}: IZoomConfig): IZoomConfig => {
	scale *= 1.25;
	xOffset -= window.innerWidth / 10;
	yOffset -= window.innerHeight / 10;
	xOffset *= 1.25;
	yOffset *= 1.25;

	return {
		scale,
		offset: [xOffset, yOffset],
	};
};

export const scaleReset = (config: IZoomConfig): IZoomConfig => {
	if (config.scale > 1) { // zoomed in
		while (config.scale > 1) {
			config = scaleSmaller(config);
		}
	}
	else {
		while (config.scale < 1) {
			config = scaleBigger(config);
		}
	}

	config.scale = 1;

	return config;
};

export const showOverlay = (item: Connection | Endpoint, overlayId: string) => {
	const overlay = item.getOverlay(overlayId);
	if (overlay) {
		overlay.setVisible(true);
	}
};

export const hideOverlay = (item: Connection | Endpoint, overlayId: string) => {
	const overlay = item.getOverlay(overlayId);
	if (overlay) {
		overlay.setVisible(false);
	}
};

export const showOrHideMidpointArrow = (connection: Connection) => {
	const hasItemsLabel = !!connection.getOverlay(OVERLAY_RUN_ITEMS_ID);

	const sourceEndpoint = connection.endpoints[0];
	const targetEndpoint = connection.endpoints[1];

	const sourcePosition = sourceEndpoint.anchor.lastReturnValue[0];
	const targetPosition = targetEndpoint.anchor.lastReturnValue[0];

	const minimum = hasItemsLabel ? 150 : 0;
	const isBackwards = sourcePosition >= targetPosition;
	const isTooLong = Math.abs(sourcePosition - targetPosition) >= minimum;

	const arrow = connection.getOverlay(OVERLAY_MIDPOINT_ARROW_ID);
	if (arrow) {
		arrow.setVisible(isBackwards && isTooLong);
		arrow.setLocation(hasItemsLabel ? .6: .5);
	}
};

export const getConnectorLengths = (connection: Connection): [number, number] => {
	// @ts-ignore
	const bounds = connection.connector.bounds;
	const diffX = Math.abs(bounds.maxX - bounds.minX);
	const diffY = Math.abs(bounds.maxY - bounds.minY);

	return [diffX, diffY];
};

export const showOrHideItemsLabel = (connection: Connection) => {
	const overlay = connection.getOverlay(OVERLAY_RUN_ITEMS_ID);
	if (!overlay) {
		return;
	}

	const [diffX, diffY] = getConnectorLengths(connection);

	if (diffX < MIN_X_TO_SHOW_OUTPUT_LABEL && diffY < MIN_Y_TO_SHOW_OUTPUT_LABEL) {
		overlay.setVisible(false);
	}
	else {
		overlay.setVisible(true);
	}
};

export const getIcon = (name: string): string => {
	if (name === 'trash') {
		return `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="trash" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="svg-inline--fa fa-trash fa-w-14 Icon__medium_ctPPJ"><path data-v-66d5c7e2="" fill="currentColor" d="M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z" class=""></path></svg>`;
	}

	if (name === 'plus') {
		return `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="plus" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="svg-inline--fa fa-plus fa-w-14 Icon__medium_ctPPJ"><path data-v-301ed208="" fill="currentColor" d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z" class=""></path></svg>`;
	}

	return '';
};


const canUsePosition = (position1: XYPosition, position2: XYPosition) => {
	if (Math.abs(position1[0] - position2[0]) <= 100) {
		if (Math.abs(position1[1] - position2[1]) <= 50) {
			return false;
		}
	}

	return true;
};

export const getNewNodePosition = (nodes: INodeUi[], newPosition: XYPosition, movePosition?: XYPosition): XYPosition => {
	const targetPosition: XYPosition = [...newPosition];

	targetPosition[0] = targetPosition[0] - (targetPosition[0] % 20);
	targetPosition[1] = targetPosition[1] - (targetPosition[1] % 20);

	if (!movePosition) {
		movePosition = [40, 40];
	}

	let conflictFound = false;
	let i, node;
	do {
		conflictFound = false;
		for (i = 0; i < nodes.length; i++) {
			node = nodes[i];
			if (!canUsePosition(node.position, targetPosition)) {
				conflictFound = true;
				break;
			}
		}

		if (conflictFound === true) {
			targetPosition[0] += movePosition[0];
			targetPosition[1] += movePosition[1];
		}
	} while (conflictFound === true);

	return targetPosition;
};

export const getMousePosition = (e: MouseEvent | TouchEvent): XYPosition => {
	// @ts-ignore
	const x = e.pageX !== undefined ? e.pageX : (e.touches && e.touches[0] && e.touches[0].pageX ? e.touches[0].pageX : 0);
	// @ts-ignore
	const y = e.pageY !== undefined ? e.pageY : (e.touches && e.touches[0] && e.touches[0].pageY ? e.touches[0].pageY : 0);

	return [x, y];
};

export const getRelativePosition = (x: number, y: number, scale: number, offset: XYPosition): XYPosition => {
	return [
		(x - offset[0]) / scale,
		(y - offset[1]) / scale,
	];
};

export const getBackgroundStyles = (scale: number, offsetPosition: XYPosition) => {
	const squareSize = 20 * scale;
	const dotSize = 1 * scale;
	const dotPosition = 10 * scale;
	const styles: object = {
		'background-size': `${squareSize}px ${squareSize}px`,
		'background-position': `left ${offsetPosition[0]}px top ${offsetPosition[1]}px`,
	};
	if (squareSize > 10.5) {
		const dotColor = getStyleTokenValue('--color-canvas-dot');
		return {
			...styles,
			'background-image': `radial-gradient(circle at ${dotPosition}px ${dotPosition}px, ${dotColor} ${dotSize}px, transparent 0)`,
		};
	}
	return styles;
};

export const hideConnectionActions = (connection: Connection | null) => {
	if (connection) {
		hideOverlay(connection, OVERLAY_CONNECTION_ACTIONS_ID);
		showOrHideItemsLabel(connection);
		showOrHideMidpointArrow(connection);
	}
};

export const showConectionActions = (connection: Connection | null) => {
	if (connection) {
		showOverlay(connection, OVERLAY_CONNECTION_ACTIONS_ID);
		hideOverlay(connection, OVERLAY_RUN_ITEMS_ID);
		if (!connection.getOverlay(OVERLAY_RUN_ITEMS_ID)) {
			hideOverlay(connection, OVERLAY_MIDPOINT_ARROW_ID);
		}
	}
};

export const getOutputSummary = (data: ITaskData[], nodeConnections: NodeInputConnections) => {
	const outputMap: {[sourceOutputIndex: string]: {[targetNodeName: string]: {[targetInputIndex: string]: {total: number, iterations: number}}}} = {};

	data.forEach((run: ITaskData) => {
		if (!run.data || !run.data.main) {
			return;
		}

		run.data.main.forEach((output: INodeExecutionData[] | null, i: number) => {
			if (!nodeConnections[i]) {
				return;
			}

			nodeConnections[i]
				.map((connection: IConnection) => {
					const sourceOutputIndex = i;
					const targetNodeName = connection.node;
					const targetInputIndex = connection.index;

					if (!outputMap[sourceOutputIndex]) {
						outputMap[sourceOutputIndex] = {};
					}

					if (!outputMap[sourceOutputIndex][targetNodeName]) {
						outputMap[sourceOutputIndex][targetNodeName] = {};
					}

					if (!outputMap[sourceOutputIndex][targetNodeName][targetInputIndex]) {
						outputMap[sourceOutputIndex][targetNodeName][targetInputIndex] = {
							total: 0,
							iterations: 0,
						};
					}

					outputMap[sourceOutputIndex][targetNodeName][targetInputIndex].total += output ? output.length : 0;
					outputMap[sourceOutputIndex][targetNodeName][targetInputIndex].iterations += output ? 1 : 0;
				});
		});
	});

	return outputMap;
};

export const resetConnection = (connection: Connection) => {
	connection.removeOverlay(OVERLAY_RUN_ITEMS_ID);
	connection.setPaintStyle(CONNECTOR_PAINT_STYLE_DEFAULT);
	showOrHideMidpointArrow(connection);
	// @ts-ignore
	if (connection.canvas) {
		// @ts-ignore
		(connection.canvas as Element).classList.remove('success');
	}
};

export const addConnectionOutputSuccess = (connection: Connection, output: {total: number, iterations: number}) => {
	connection.setPaintStyle(CONNECTOR_PAINT_STYLE_SUCCESS);
	// @ts-ignore
	if (connection.canvas) {
		// @ts-ignore
		(connection.canvas as Element).classList.add('success');
	}

	if (connection.getOverlay(OVERLAY_RUN_ITEMS_ID)) {
		connection.removeOverlay(OVERLAY_RUN_ITEMS_ID);
	}

	let label = `${output.total}`;
	label = output.total > 1 ? `${label} items` : `${label} item`;
	label = output.iterations > 1 ? `${label} total` : label;

	connection.addOverlay([
		'Label',
		{
			id: OVERLAY_RUN_ITEMS_ID,
			label,
			cssClass: 'connection-output-items-label',
			location: .5,
		},
	]);

	showOrHideItemsLabel(connection);
	showOrHideMidpointArrow(connection);
};


export const getZoomToFit = (nodes: INodeUi[]): {offset: XYPosition, zoomLevel: number} => {
	const {minX, minY, maxX, maxY} = getWorkflowCorners(nodes);

	const PADDING = NODE_SIZE * 4;

	const editorWidth = window.innerWidth;
	const diffX = maxX - minX + SIDEBAR_WIDTH + PADDING;
	const scaleX = editorWidth / diffX;

	const editorHeight = window.innerHeight;
	const diffY = maxY - minY + HEADER_HEIGHT + PADDING;
	const scaleY = editorHeight / diffY;

	const zoomLevel = Math.min(scaleX, scaleY, 1);
	let xOffset = (minX * -1) * zoomLevel + SIDEBAR_WIDTH; // find top right corner
	xOffset += (editorWidth - SIDEBAR_WIDTH - (maxX - minX + NODE_SIZE) * zoomLevel) / 2; // add padding to center workflow

	let yOffset = (minY * -1) * zoomLevel + HEADER_HEIGHT; // find top right corner
	yOffset += (editorHeight - HEADER_HEIGHT - (maxY - minY + NODE_SIZE * 2) * zoomLevel) / 2; // add padding to center workflow

	return {
		zoomLevel,
		offset: [xOffset, yOffset],
	};
};

export const getUniqueNodeName = (nodes: INodeUi[], originalName: string, additinalUsedNames?: string[]) => {
	// Check if node-name is unique else find one that is
	additinalUsedNames = additinalUsedNames || [];

	// Get all the names of the current nodes
	const nodeNames = nodes.map((node: INodeUi) => {
		return node.name;
	});

	// Check first if the current name is already unique
	if (!nodeNames.includes(originalName) && !additinalUsedNames.includes(originalName)) {
		return originalName;
	}

	const nameMatch = originalName.match(/(.*\D+)(\d*)/);
	let ignore, baseName, nameIndex, uniqueName;
	let index = 1;

	if (nameMatch === null) {
		// Name is only a number
		index = parseInt(originalName, 10);
		baseName = '';
		uniqueName = baseName + index;
	} else {
		// Name is string or string/number combination
		[ignore, baseName, nameIndex] = nameMatch;
		if (nameIndex !== '') {
			index = parseInt(nameIndex, 10);
		}
		uniqueName = baseName;
	}

	while (
		nodeNames.includes(uniqueName) ||
		additinalUsedNames.includes(uniqueName)
	) {
		uniqueName = baseName + (index++);
	}

	return uniqueName;
};

export const showDropConnectionState = (connection: Connection) => {
	connection.setPaintStyle(CONNECTOR_PAINT_STYLE_PRIMARY);
	hideOverlay(connection, OVERLAY_DROP_NODE_ID);
};

export const showPullConnectionState = (connection: Connection) => {
	connection.setPaintStyle(CONNECTOR_PAINT_STYLE_DEFAULT);
	showOverlay(connection, OVERLAY_DROP_NODE_ID);
};

export const resetInputLabelPosition = (targetEndpoint: Endpoint) => {
	const inputNameOverlay = targetEndpoint.getOverlay(OVERLAY_INPUT_NAME_LABEL);
	if (inputNameOverlay) {
		inputNameOverlay.setLocation(OVERLAY_INPUT_NAME_LABEL_POSITION);
	}
};

export const moveBackInputLabelPosition = (targetEndpoint: Endpoint) => {
	const inputNameOverlay = targetEndpoint.getOverlay(OVERLAY_INPUT_NAME_LABEL);
	if (inputNameOverlay) {
		inputNameOverlay.setLocation(OVERLAY_INPUT_NAME_LABEL_POSITION_MOVED);
	}
};

export const addConnectionActionsOverlay = (connection: Connection, onDelete: Function, onAdd: Function) => {
	connection.addOverlay([
		'Label',
		{
			id: OVERLAY_CONNECTION_ACTIONS_ID,
			label: `<div class="add">${getIcon('plus')}</div> <div class="delete">${getIcon('trash')}</div>`,
			cssClass: OVERLAY_CONNECTION_ACTIONS_ID,
			visible: false,
			events: {
				mousedown: (overlay: Overlay, event: MouseEvent) => {
					const element = event.target as HTMLElement;
					if (element.classList.contains('delete') || (element.parentElement && element.parentElement.classList.contains('delete'))) {
						onDelete();
					}
					else if (element.classList.contains('add') || (element.parentElement && element.parentElement.classList.contains('add'))) {
						onAdd();
					}
				},
			},
		},
	]);
};
