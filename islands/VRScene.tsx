import { useEffect, useRef, useState } from "preact/hooks";
import * as THREE from "three";

interface InteractiveMesh extends THREE.Mesh {
  material: THREE.MeshPhongMaterial;
}

interface Player {
  id: string;
  mesh: THREE.Mesh;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
}

export default function VRScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cubeRef = useRef<InteractiveMesh | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const playersRef = useRef<Map<string, Player>>(new Map());
  const playerIdRef = useRef<string>("");
  const [isVRSupported, setIsVRSupported] = useState(false);
  const [isInVR, setIsInVR] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const audioListenerRef = useRef<THREE.AudioListener | null>(null);
  const soundRef = useRef<THREE.PositionalAudio | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mouseRef = useRef({
    isDown: false,
    x: 0,
    y: 0
  });

  // WebSocketメッセージの送信
  const sendWsMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // シーンの初期化
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // カメラの設定
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // 空間音響の設定
    const audioListener = new THREE.AudioListener();
    camera.add(audioListener);
    audioListenerRef.current = audioListener;

    // サウンドの作成
    const sound = new THREE.PositionalAudio(audioListener);
    const oscillator = audioListener.context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioListener.context.currentTime);
    sound.setNodeSource(oscillator);
    sound.setRefDistance(1);
    sound.setVolume(0.5);
    soundRef.current = sound;

    // レンダラーの設定
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.xr.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // VRサポートの確認
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then(supported => {
        setIsVRSupported(supported);
      });
    }

    // 環境の作成
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshStandardMaterial({ 
        color: 0x808080,
        roughness: 0.8 
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    scene.add(floor);

    // インタラクティブなオブジェクトの作成
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x0000ff,
      emissive: 0x000033
    });
    const cube = new THREE.Mesh(geometry, material) as InteractiveMesh;
    cube.add(sound);
    scene.add(cube);
    cubeRef.current = cube;

    // ライトの追加
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // WebSocket接続の確立
    const ws = new WebSocket(`ws://${window.location.host}/api/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket接続が確立されました');
      setIsWsConnected(true);
    };

    ws.onclose = () => {
      console.log('WebSocket接続が切断されました');
      setIsWsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocketエラー:', error);
      setIsWsConnected(false);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "init":
          playerIdRef.current = message.yourId;
          message.clients.forEach((client: any) => {
            if (client.id !== playerIdRef.current) {
              addPlayer(client.id, client.position);
            }
          });
          break;

        case "playerJoined":
          addPlayer(message.clientId, message.position);
          break;

        case "playerLeft":
          removePlayer(message.clientId);
          break;

        case "playerMoved":
          updatePlayerPosition(message.clientId, message.position);
          break;

        case "playerRotated":
          updatePlayerRotation(message.clientId, message.rotation);
          break;

        case "playerInteraction":
          handlePlayerInteraction(message.clientId, message.data);
          break;
      }
    };

    // プレイヤーの追加
    function addPlayer(id: string, position: { x: number; y: number; z: number }) {
      const playerGeometry = new THREE.BoxGeometry(0.3, 0.6, 0.3);
      const playerMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
      const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
      playerMesh.position.set(position.x, position.y, position.z);
      scene.add(playerMesh);

      playersRef.current.set(id, {
        id,
        mesh: playerMesh,
        position,
        rotation: { x: 0, y: 0, z: 0 },
      });
    }

    // プレイヤーの削除
    function removePlayer(id: string) {
      const player = playersRef.current.get(id);
      if (player) {
        scene.remove(player.mesh);
        playersRef.current.delete(id);
      }
    }

    // プレイヤーの位置更新
    function updatePlayerPosition(id: string, position: { x: number; y: number; z: number }) {
      const player = playersRef.current.get(id);
      if (player) {
        player.position = position;
        player.mesh.position.set(position.x, position.y, position.z);
      }
    }

    // プレイヤーの回転更新
    function updatePlayerRotation(id: string, rotation: { x: number; y: number; z: number }) {
      const player = playersRef.current.get(id);
      if (player) {
        player.rotation = rotation;
        player.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
      }
    }

    // プレイヤーのインタラクション処理
    function handlePlayerInteraction(id: string, data: any) {
      const player = playersRef.current.get(id);
      if (player && data.type === "cubeClick") {
        // 他のプレイヤーのインタラクションを視覚的に表示
        const flash = new THREE.PointLight(0xffffff, 1, 2);
        flash.position.copy(player.mesh.position);
        scene.add(flash);
        setTimeout(() => scene.remove(flash), 200);
      }
    }

    // VRコントローラーの設定
    function setupVRControllers() {
      function onSelectStart(event: { target: THREE.XRTargetRaySpace }) {
        const controller = event.target;
        const intersects = getIntersections(controller);
        
        if (intersects.length > 0) {
          const intersection = intersects[0];
          const object = intersection.object as InteractiveMesh;
          if (object === cube) {
            object.material.emissive.setHex(0x0000ff);
            if (soundRef.current && !soundRef.current.isPlaying) {
              soundRef.current.play();
            }
            // インタラクションを他のプレイヤーに通知
            sendWsMessage({
              type: "interaction",
              clientId: playerIdRef.current,
              data: { type: "cubeClick" }
            });
          }
        }
      }

      function onSelectEnd(event: { target: THREE.XRTargetRaySpace }) {
        const controller = event.target;
        const intersects = getIntersections(controller);
        
        if (intersects.length > 0) {
          const intersection = intersects[0];
          const object = intersection.object as InteractiveMesh;
          if (object === cube) {
            object.material.emissive.setHex(0x000033);
          }
        }
      }

      const controller1 = renderer.xr.getController(0);
      controller1.addEventListener('selectstart', onSelectStart);
      controller1.addEventListener('selectend', onSelectEnd);
      scene.add(controller1);

      const controller2 = renderer.xr.getController(1);
      controller2.addEventListener('selectstart', onSelectStart);
      controller2.addEventListener('selectend', onSelectEnd);
      scene.add(controller2);
    }

    // レイキャストの設定
    const raycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();

    function getIntersections(controller: THREE.XRTargetRaySpace) {
      tempMatrix.identity().extractRotation(controller.matrixWorld);
      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
      return raycaster.intersectObjects([cube]);
    }

    // アニメーションループ
    function animate() {
      renderer.setAnimationLoop((time) => {
        if (cubeRef.current && !isInVR) {
          cubeRef.current.rotation.x += 0.01;
          cubeRef.current.rotation.y += 0.01;
        }

        // カメラの位置と回転を他のプレイヤーに送信
        if (cameraRef.current && isWsConnected) {
          sendWsMessage({
            type: "position",
            clientId: playerIdRef.current,
            data: {
              x: cameraRef.current.position.x,
              y: cameraRef.current.position.y,
              z: cameraRef.current.position.z
            }
          });

          sendWsMessage({
            type: "rotation",
            clientId: playerIdRef.current,
            data: {
              x: cameraRef.current.rotation.x,
              y: cameraRef.current.rotation.y,
              z: cameraRef.current.rotation.z
            }
          });
        }

        renderer.render(scene, camera);
      });
    }
    animate();

    // リサイズハンドラー
    function handleResize() {
      if (!cameraRef.current || !rendererRef.current) return;

      const width = window.innerWidth;
      const height = window.innerHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(width, height);
    }

    // マウスイベントハンドラー
    function handleMouseDown(event: MouseEvent) {
      mouseRef.current.isDown = true;
      mouseRef.current.x = event.clientX;
      mouseRef.current.y = event.clientY;
    }

    function handleMouseUp() {
      mouseRef.current.isDown = false;
    }

    function handleMouseMove(event: MouseEvent) {
      if (!mouseRef.current.isDown || !cameraRef.current || isInVR) return;

      const deltaX = event.clientX - mouseRef.current.x;
      const deltaY = event.clientY - mouseRef.current.y;

      // カメラの回転速度（値が小さいほど遅く回転）
      const rotationSpeed = 0.005;

      // Y軸周りの回転（左右）
      cameraRef.current.rotation.y -= deltaX * rotationSpeed;

      // X軸周りの回転（上下）を制限付きで適用
      const newRotationX = cameraRef.current.rotation.x - deltaY * rotationSpeed;
      // 上下の回転を-45度から45度に制限
      cameraRef.current.rotation.x = Math.max(
        -Math.PI / 4,
        Math.min(Math.PI / 4, newRotationX)
      );

      mouseRef.current.x = event.clientX;
      mouseRef.current.y = event.clientY;
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      if (geometry) geometry.dispose();
      if (material) material.dispose();
      if (rendererRef.current) rendererRef.current.dispose();
      renderer.setAnimationLoop(null);
      if (wsRef.current) {
        wsRef.current.close();
      }
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={containerRef}
        style={{
          width: "100vw",
          height: "100vh",
          position: "relative",
          overflow: "hidden"
,
          cursor: mouseRef.current.isDown ? "grabbing" : "grab"
        }}
      />
      {isVRSupported && !isInVR && (
        <button
          onClick={async () => {
            if (rendererRef.current?.xr && navigator.xr) {
              try {
                const session = await navigator.xr.requestSession('immersive-vr', {
                  optionalFeatures: ['local-floor', 'bounded-floor']
                });
                rendererRef.current.xr.setSession(session);
                setIsInVR(true);
                session.addEventListener('end', () => {
                  setIsInVR(false);
                });
              } catch (err) {
                console.error('VRセッションの開始に失敗しました:', err);
              }
            }
          }}
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 24px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          VRを開始
        </button>
      )}
    </div>
  );
}