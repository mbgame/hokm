import HelperPointer from '.';

type Props = {
  helperIndex?: number;

};

const GameHelpers: React.FC<Props> = ({ helperIndex }) => {
  return (
    <>
        {
            (helperIndex === 0) && 
            <HelperPointer
                position={[0, 7, 2]}
                rotation={[Math.PI, 0, 0]}
                scale={[1, 1, 1]}
                color='red'
                animationSpeed={0.1}
            />
        }

        {
            (helperIndex === 1) && 
            <HelperPointer
                position={[3, 7, -5]}
                rotation={[Math.PI, 0, 0]}
                scale={[1, 1, 1]}
                color='red'
                animationSpeed={0.1}
            />
        }

        {
            (helperIndex === 2) && 
            <HelperPointer
                position={[0, 7, -5]}
                rotation={[Math.PI, 0, 0]}
                scale={[1, 1, 1]}
                color='red'
                animationSpeed={0.1}
            />
        }
    </>
  );
};

export default GameHelpers;