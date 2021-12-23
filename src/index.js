import {
    AmbientLight,
    AxesHelper,
    DirectionalLight,
    GridHelper,
    PerspectiveCamera,
    Scene,
    MeshLambertMaterial,
    Raycaster,
    Vector2,
    WebGLRenderer,
} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {IFCLoader} from "web-ifc-three/IFCLoader";
import { 
    IFCLOCALPLACEMENT, IfcLocalPlacement,
    IFCDIRECTION, IfcDirection,
    IFCAXIS2PLACEMENT3D, IfcAxis2Placement3D,
    IFCAXIS2PLACEMENT2D, IfcAxis2Placement2D,
    IFCCIRCLEPROFILEDEF, IfcCircleProfileDef,
    IfcProfileTypeEnum,
    IFCEXTRUDEDAREASOLID, IfcExtrudedAreaSolid,
    IFCCARTESIANPOINT, IfcCartesianPoint,
    IFCCOLUMN, IfcColumn } from "web-ifc";
import {
    acceleratedRaycast,
    computeBoundsTree,
    disposeBoundsTree
} from 'three-mesh-bvh';

//Creates the Three.js scene
const scene = new Scene();

//Object to store the size of the viewport
const size = {
    width: window.innerWidth,
    height: window.innerHeight,
};

//Creates the camera (point of view of the user)
const camera = new PerspectiveCamera(75, size.width / size.height);
camera.position.z = 15;
camera.position.y = 13;
camera.position.x = 8;

//Creates the lights of the scene
const lightColor = 0xffffff;

const ambientLight = new AmbientLight(lightColor, 0.5);
scene.add(ambientLight);

const directionalLight = new DirectionalLight(lightColor, 1);
directionalLight.position.set(0, 10, 0);
directionalLight.target.position.set(-5, 0, 0);
scene.add(directionalLight);
scene.add(directionalLight.target);

//Sets up the renderer, fetching the canvas of the HTML
const threeCanvas = document.getElementById("three-canvas");
const renderer = new WebGLRenderer({canvas: threeCanvas, alpha: true});
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//Creates grids and axes in the scene
const grid = new GridHelper(50, 30);
scene.add(grid);

const axes = new AxesHelper();
axes.material.depthTest = false;
axes.renderOrder = 1;
scene.add(axes);

//Creates the orbit controls (to navigate the scene)
const controls = new OrbitControls(camera, threeCanvas);
controls.enableDamping = true;
controls.target.set(-2, 0, 0);

//Animation loop
const animate = () => {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
};

animate();

//Adjust the viewport to the size of the browser
window.addEventListener("resize", () => {
    (size.width = window.innerWidth), (size.height = window.innerHeight);
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
});

//Sets up the IFC loading
const ifcModels = [];
const ifcLoader = new IFCLoader();
const ifcAPI = ifcLoader.ifcManager.ifcAPI;
ifcAPI
.Init()
.then(() => {

    let modelID = ifcAPI.CreateModel();
    /** */
    let EID = 1;

    function real(v/*: number*/)
    {
        return { type: 4, value: v}
    }

    function ref(v/*: number*/)
    {
        return { type: 5, value: v}
    }

    function empty()
    {
        return { type: 6}
    }

    function str(v/*: string*/)
    {
        return { type: 1, value: v}
    }

    function enm(v/*: string*/)
    {
        return { type: 3, value: v}
    }

    function makePt(x, y, z) {
        return {
            x: x/*: number*/, 
            y: y/*number*/,
            z: z/*number*/
        }
    }

    function makePt2D(x, y) {
        return {
            x: x/*: number*/, 
            y: y/*number*/
        }
    }

    function Point(model/*: number*/, api/*: IfcAPI*/, o/*: pt*/)
    {
        let ID = EID++;
        let pt = new IfcCartesianPoint(ID, 
                        IFCCARTESIANPOINT, 
                        [real(o.x), real(o.y), real(o.z)]);
        api.WriteLine(model, pt);
        return ref(ID);
    }

    function ExtrudedAreaSolid(modelID, ifcAPI, pos/*: pt*/, dir/*: pt*/, rad/*: number*/, len/*: number*/)
    {
        let ID = EID++;
        let pt = new IfcExtrudedAreaSolid(ID, 
                        IFCEXTRUDEDAREASOLID,
                        CircleProfile(model, api, rad, { x: 0, y: 0 }),
                        AxisPlacement(model, api, pos),
                        Dir(model, api, dir),
                        real(len));
        api.WriteLine(model, pt);
        return ref(ID);
    }

    function Dir(model/*: number*/, api/*: IfcAPI*/, o/*: pt*/)
    {
        let ID = EID++;
        let pt = new IfcDirection(ID, 
                        IFCDIRECTION, 
                        [real(o.x), real(o.y), real(o.z)]);
        api.WriteLine(model, pt);
        return ref(ID);
    }
    
    function Point2D(model/*: number*/, api/*: IfcAPI*/, o/*: pt2D*/)
    {
        let ID = EID++;
        let pt = new IfcCartesianPoint(ID, 
                        IFCCARTESIANPOINT, 
                        [real(o.x), real(o.y)]);
        api.WriteLine(model, pt);
        return ref(ID);
    }
    
    function AxisPlacement(model/*: number*/, api/*: IfcAPI*/, o/*: pt*/)
    {
        let locationID = Point(model, api, o);
        let ID = EID++;
        let pt = new IfcAxis2Placement3D(ID, 
                        IFCAXIS2PLACEMENT3D, 
                        locationID, 
                        empty(),
                        empty());
        api.WriteLine(model, pt);
        return ref(ID);
    }
    
    function AxisPlacement2D(model/*: number*/, api/*: IfcAPI*/, o/*: pt2D*/)
    {
        let locationID = Point2D(model, api, o);
        let ID = EID++;
        let pt = new IfcAxis2Placement2D(ID, 
                        IFCAXIS2PLACEMENT2D,
                        locationID, 
                        empty());
        api.WriteLine(model, pt);
        return ref(ID);
    }
    
    function Placement(model/*: number*/, api/*: IfcAPI*/, o/*: pt*/)
    {
        let axisID = AxisPlacement(model, api, o);
        let ID = EID++;
        let pt = new IfcLocalPlacement(ID, 
                        IFCLOCALPLACEMENT,
                        empty(),
                        axisID);
        api.WriteLine(model, pt);
        return ref(ID);
    }
    
    function CircleProfile(model/*: number*/, api/*: IfcAPI*/, rad/*: number*/, o/*: pt2D*/)
    {
        let ID = EID++;
        let pt = new IfcCircleProfileDef(ID,
                        IFCCIRCLEPROFILEDEF,
                        enm(IfcProfileTypeEnum.AREA),
                        str('column-prefab'),
                        AxisPlacement2D(model, api, o),
                        real(rad));
        api.WriteLine(model, pt);
        return ref(ID);
    }
    
    function ExtrudedAreaSolid(model/*: number*/, api/*: IfcAPI*/, pos/*: pt*/, dir/*: pt*/, rad/*: number*/, len/*: number*/)
    {
        let ID = EID++;
        let pt = new IfcExtrudedAreaSolid(ID, 
                        IFCEXTRUDEDAREASOLID,
                        CircleProfile(model, api, rad, { x: 0, y: 0 }),
                        AxisPlacement(model, api, pos),
                        Dir(model, api, dir),
                        real(len));
        api.WriteLine(model, pt);
        return ref(ID);
    }
    
    function StandardColumn(model/*: number*/, api/*: IfcAPI*/, pos/*: pt*/)
    {
        let shapeID = ExtrudedAreaSolid(model, api, 
            { x: -2, y: 0, z: -1 }, 
            { x: 0, y: 0, z: 1 },
            0.25,
            2);
    
        let ID = EID++;
        let pt = new IfcColumn(ID, 
                        IFCCOLUMN,
                        str("GUID"),
                        empty(),
                        str("name"),
                        empty(),
                        str("label"),
                        Placement(model, api, pos),
                        shapeID,
                        str("sadf"),
                        empty());
        api.WriteLine(model, pt);
        return ref(ID);
    }

    // https://tomvandig.github.io/web-ifc/examples/viewer/index.html
    StandardColumn(modelID, ifcAPI, makePt(0, 0, 0));
    
    let data = ifcAPI.ExportFileAsIFC(modelID);

    let content = new TextDecoder()
    .decode(data)
    .replace("FILE_SCHEMA(('IFC2X3'));", "FILE_SCHEMA(('IFC4'));");
    console.log(content);
    ifcAPI.CloseModel(modelID);
    return ifcLoader.parse(new TextEncoder().encode(content));
})
.then(ifcModel => {
    ifcModels.push(ifcModel);
    scene.add(ifcModel);
    ifcAPI.CloseModel(ifcModel.modelID);
})

// node_modules\web-ifc-three\IFC\Components\IFCModel.d.ts


//

//ifcLoader.ifcManager.setWasmPath("");


// ifcLoader.load("empty_exported.ifc", (ifcModel) => {
//     debugger;
//     // const ifcAPI = ifcLoader.ifcManager.ifcAPI;
//     // let modelID = ifcAPI.CreateModel();
//     // //let lines = ifcAPI.GetAllLines();
//     // //ifcAPI.WriteLine(modelID, ifcAPI.GetLine(modelID, 0));

//     // function str(v)
//     // {
//     //     return { type: 1, value: v}
//     // }

//     // function empty()
//     // {
//     //     return { type: 6}
//     // }
    
//     // // https://tomvandig.github.io/web-ifc/examples/viewer/index.html
//     // let pt = new IfcColumn(1, 
//     //     IFCCOLUMN,
//     //     str("GUID"),
//     //     empty(),
//     //     str("name"),
//     //     empty(),
//     //     str("label"),
//     //     //Placement(model, api, pos),
//     //     //shapeID,
//     //     str("sadf"),
//     //     empty());

//     // ifcAPI.WriteLine(modelID, pt);

//     // let data = ifcAPI.ExportFileAsIFC(modelID);
//     // let content = new TextDecoder().decode(data);
//     // ifcAPI.CloseModel(modelID);

//     // grab all propertyset lines in the file
    
    
//     // IFCAIRTERMINALBOX

//     //let lines = ifcAPI.GetLineIDsWithType(ifcModel.modelID, IFCPROPERTYSET);


//     // count number of properties
//     // let numPropsCount = 0;

//     // for (let i = 0; i < lines.size(); i++)
//     // {
//     //     let expressID = lines.get(i);
//     //     if (expressID !== 0)
//     //     {
//     //         let propertySet = ifcLoader.ifcManager.ifcAPI.GetLine(ifcModel.modelID, expressID);
//     //         numPropsCount += propertySet.HasProperties.length;
//     //     }
//     // }
  

//     ifcModels.push(ifcModel);
//     scene.add(ifcModel);
// });


// Sets up optimized picking
ifcLoader.ifcManager.setupThreeMeshBVH(
    computeBoundsTree,
    disposeBoundsTree,
    acceleratedRaycast);

const raycaster = new Raycaster();
raycaster.firstHitOnly = true;
const mouse = new Vector2();

function cast(event) {

    // Computes the position of the mouse on the screen
    const bounds = threeCanvas.getBoundingClientRect();

    const x1 = event.clientX - bounds.left;
    const x2 = bounds.right - bounds.left;
    mouse.x = (x1 / x2) * 2 - 1;

    const y1 = event.clientY - bounds.top;
    const y2 = bounds.bottom - bounds.top;
    mouse.y = -(y1 / y2) * 2 + 1;

    // Places it on the camera pointing to the mouse
    raycaster.setFromCamera(mouse, camera);

    // Casts a ray
    return raycaster.intersectObjects(ifcModels);
}

// Creates subset materials
const preselectMat = new MeshLambertMaterial({
    transparent: true,
    opacity: 0.6,
    color: 0xff88ff,
    depthTest: false
})

const selectMat = new MeshLambertMaterial({
    transparent: true,
    opacity: 0.6,
    color: 0xff00ff,
    depthTest: false
})

const ifc = ifcLoader.ifcManager;
// References to the previous selections
const highlightModel = { id: - 1};
const selectModel = { id: - 1};

function highlight(event, material, model, multiple = true) {
    const found = cast(event)[0];
    if (found) {

        // Gets model ID
        model.id = found.object.modelID;

        // Gets Express ID
        const index = found.faceIndex;
        const geometry = found.object.geometry;
        const id = ifc.getExpressId(geometry, index);

        // Creates subset
        ifcLoader.ifcManager.createSubset({
            modelID: model.id,
            ids: [id],
            material: material,
            scene: scene,
            removePrevious: multiple
        })
    } else {
        // Remove previous highlight
        ifc.removeSubset(model.id, scene, material);
    }
}

window.onmousemove = (event) => highlight(event, preselectMat, highlightModel);

window.ondblclick = (event) => highlight(event, selectMat, selectModel);