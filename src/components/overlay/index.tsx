import { useWinner } from '../../context/winnerContext';
import styles from '../../styles/Scene.module.css'

const Overlay: React.FC = () => {
  const { winner } = useWinner();

  return (
    <div className={styles.overlay}>
      <div className={styles.overlay}>Winner: {winner}</div>
    </div>
  );
};

export default Overlay;