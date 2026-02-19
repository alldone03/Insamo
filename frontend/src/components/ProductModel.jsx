import React, { Suspense, Component } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF } from '@react-three/drei';

// Error Boundary to catch loading failures (like missing .glb file)
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

function Model(props) {
    const { scene } = useGLTF('/models/product.glb');
    return <primitive object={scene} {...props} />;
}

function PlaceholderModel() {
    return (
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#3b82f6" opacity={0.5} transparent />
            <gridHelper args={[10, 10]} />
        </mesh>
    );
}

const ProductModel = () => {
    return (
        <div className="w-full h-[400px] lg:h-[500px] cursor-grab active:cursor-grabbing">
            <Canvas shadows dpr={[1, 2]} camera={{ fov: 50 }}>
                <Suspense fallback={<PlaceholderModel />}>
                    <ErrorBoundary fallback={<PlaceholderModel />}>
                        <Stage environment="city" intensity={0.6}>
                            <Model scale={0.01} />
                        </Stage>
                    </ErrorBoundary>
                </Suspense>
                <OrbitControls autoRotate autoRotateSpeed={4} enableZoom={false} />
            </Canvas>
        </div>
    );
};

export default ProductModel;

